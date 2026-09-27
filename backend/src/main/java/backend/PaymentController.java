package backend;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.HashSet;
import java.util.Set;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final BillRepository billRepository;

    public PaymentController(
            PaymentRepository paymentRepository,
            BillRepository billRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.billRepository = billRepository;
    }

    // 전체 수납내역 조회
    @GetMapping
    public List<Payment> getPayments() {
        return paymentRepository.findAll();
    }

    @PostMapping("/bulk")
    @Transactional
    public List<Payment> createPayments(@RequestBody BulkPaymentRequest request) {
        if (request.paymentMonth() == null || !request.paymentMonth().matches("\\d{4}-\\d{2}")
                || request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "납부월과 납부 자료를 입력해 주세요.");
        }
        LocalDate paidDate;
        try {
            paidDate = LocalDate.parse(request.paymentMonth() + "-01");
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바른 납부월을 입력해 주세요.");
        }
        Set<Long> billIds = new HashSet<>();
        List<Payment> saved = new java.util.ArrayList<>();
        for (BulkPaymentLine item : request.items()) {
            if (item.billId() == null || !billIds.add(item.billId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "같은 청구서는 한 번만 선택할 수 있습니다.");
            }
            Bill bill = billRepository.findById(item.billId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "청구서를 찾을 수 없습니다."));
            if (item.amount() == null || item.amount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "납부 금액이 0보다 커야 합니다.");
            }
            if (item.fullPayment() && (bill.getTotalAmount() == null
                    || item.amount().compareTo(bill.getTotalAmount()) != 0)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "전액 납부 금액은 해당 청구금액과 같아야 합니다.");
            }
            Payment existing = paymentRepository.findFirstByBillIdOrderByIdDesc(item.billId()).orElse(null);
            BigDecimal amount = item.amount();
            if (item.fullPayment()) {
                BigDecimal totalAmount = bill.getTotalAmount() == null ? BigDecimal.ZERO : bill.getTotalAmount();
                BigDecimal paidAmount = bill.getPaidAmount() == null ? BigDecimal.ZERO : bill.getPaidAmount();
                BigDecimal replacedAmount = existing == null || existing.getAmount() == null
                        ? BigDecimal.ZERO : existing.getAmount();
                amount = totalAmount.subtract(paidAmount.subtract(replacedAmount));
                if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 청구서는 이미 전액 납부되었습니다.");
                }
            }
            LocalDate itemPaidDate = item.paidDate() == null ? paidDate : item.paidDate();
            PaymentRequest paymentRequest = new PaymentRequest(item.billId(), amount, itemPaidDate,
                    item.paymentMethod() == null || item.paymentMethod().isBlank() ? "계좌이체" : item.paymentMethod(), item.note());
            saved.add(existing == null
                    ? createPayment(paymentRequest)
                    : updatePayment(existing.getId(), paymentRequest));
        }
        return saved;
    }

    // 특정 청구서의 수납내역 조회
    @GetMapping("/bill/{billId}")
    public List<Payment> getPaymentsByBill(
            @PathVariable Long billId
    ) {
        return paymentRepository.findByBillId(billId);
    }

    // 수납 등록
    @PostMapping
    public Payment createPayment(
            @RequestBody PaymentRequest request
    ) {
        Bill bill = billRepository.findById(request.billId())
                .orElseThrow(() ->
                        new RuntimeException("청구서를 찾을 수 없습니다.")
                );

        BigDecimal amount = request.amount();

        if (amount == null ||
                amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "납부금액은 0보다 커야 합니다.");
        }

        BigDecimal paidAmount = bill.getPaidAmount();

        if (paidAmount == null) {
            paidAmount = BigDecimal.ZERO;
        }

        BigDecimal totalAmount = bill.getTotalAmount();

        if (totalAmount == null) {
            totalAmount = BigDecimal.ZERO;
        }

        BigDecimal newPaidAmount = paidAmount.add(amount);
        BigDecimal unpaidAmount =
                totalAmount.subtract(newPaidAmount);

        if (unpaidAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "미납금액보다 많이 납부할 수 없습니다.");
        }

        bill.setPaidAmount(newPaidAmount);
        bill.setUnpaidAmount(unpaidAmount);

        if (unpaidAmount.compareTo(BigDecimal.ZERO) == 0) {
            bill.setStatus("완납");
        } else {
            bill.setStatus("일부 납부");
        }

        billRepository.save(bill);

        Payment payment = new Payment();
        payment.setAmount(amount);
        payment.setPaidDate(request.paidDate());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setNote(request.note());
        payment.setBill(bill);

        return paymentRepository.save(payment);
    }

    @PutMapping("/{id}")
    @Transactional
    public Payment updatePayment(
            @PathVariable Long id,
            @RequestBody PaymentRequest request
    ) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "납부 자료를 찾을 수 없습니다."));
        Bill previousBill = payment.getBill();
        updateBillPayment(previousBill, payment.getAmount().negate());

        Bill bill = billRepository.findById(request.billId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "청구서를 찾을 수 없습니다."));
        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "납부금액은 0보다 커야 합니다.");
        }
        updateBillPayment(bill, request.amount());
        payment.setBill(bill);
        payment.setAmount(request.amount());
        payment.setPaidDate(request.paidDate());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setNote(request.note());
        return paymentRepository.save(payment);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deletePayment(@PathVariable Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found."));
        updateBillPayment(payment.getBill(), payment.getAmount().negate());
        paymentRepository.delete(payment);
    }

    private void updateBillPayment(Bill bill, BigDecimal change) {
        BigDecimal totalAmount = bill.getTotalAmount() == null
                ? BigDecimal.ZERO : bill.getTotalAmount();
        BigDecimal paidAmount = bill.getPaidAmount() == null
                ? BigDecimal.ZERO : bill.getPaidAmount();
        BigDecimal newPaidAmount = paidAmount.add(change);
        if (newPaidAmount.compareTo(BigDecimal.ZERO) < 0 || newPaidAmount.compareTo(totalAmount) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "납부 금액이 청구서의 미납 잔액을 초과합니다.");
        }
        BigDecimal unpaidAmount = totalAmount.subtract(newPaidAmount);
        bill.setPaidAmount(newPaidAmount);
        bill.setUnpaidAmount(unpaidAmount);
        bill.setStatus(unpaidAmount.compareTo(BigDecimal.ZERO) == 0 ? "완납" :
                (newPaidAmount.compareTo(BigDecimal.ZERO) == 0 ? "미납" : "일부 납부"));
        billRepository.save(bill);
    }

    public record PaymentRequest(
            Long billId,
            BigDecimal amount,
            LocalDate paidDate,
            String paymentMethod,
            String note
    ) {
    }

    public record BulkPaymentRequest(String paymentMonth, List<BulkPaymentLine> items) { }

    public record BulkPaymentLine(Long billId, boolean fullPayment, BigDecimal amount, LocalDate paidDate,
            String paymentMethod, String note) { }
}
