package backend;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "http://localhost:3000")
public class BillController {

    private final BillRepository billRepository;
    private final PaymentRepository paymentRepository;
    private final LeaseContractRepository contractRepository;
    private final OverdueInterestService overdueInterestService;

    public BillController(
            BillRepository billRepository,
            PaymentRepository paymentRepository,
            LeaseContractRepository contractRepository,
            OverdueInterestService overdueInterestService
    ) {
        this.billRepository = billRepository;
        this.paymentRepository = paymentRepository;
        this.contractRepository = contractRepository;
        this.overdueInterestService = overdueInterestService;
    }

    @GetMapping
    public List<Bill> getBills() {
        return billRepository.findAll();
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleBillError(ResponseStatusException error) {
        String message = error.getReason() == null ? "청구서 요청을 처리하지 못했습니다." : error.getReason();
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", message));
    }

    @GetMapping("/{id}")
    public Bill getBill(@PathVariable Long id) {
        return billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("청구서를 찾을 수 없습니다."));
    }

    @PostMapping("/overdue/calculate")
    public List<Bill> calculateOverdueInterest() {
        overdueInterestService.calculateAllOverdueInterest();
        return billRepository.findAll();
    }

    @PostMapping
    public Bill createBill(@RequestBody BillRequest request) {
        if (request == null || request.contractId() == null || request.billingMonth() == null
                || !request.billingMonth().matches("\\d{4}-\\d{2}") || request.dueDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "계약, 청구월, 납부기한을 입력해 주세요.");
        }
        if (isNegative(request.electricityUsage()) || isNegative(request.electricityTotalAmount())
                || isNegative(request.waterUsage()) || isNegative(request.waterTotalAmount())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용량과 공과금은 음수로 입력할 수 없습니다.");
        }
        LeaseContract contract = contractRepository.findById(request.contractId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "계약을 찾을 수 없습니다."));

        List<Bill> sameMonthBills = billRepository.findByBillingMonth(request.billingMonth()).stream()
                .filter(bill -> bill.getContract().getId().equals(contract.getId()))
                .toList();
        Bill existingBill = sameMonthBills.stream()
                .filter(bill -> !"취소".equals(bill.getStatus()))
                .findFirst().orElse(null);
        if (existingBill != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "해당 계약의 청구서가 이미 등록되어 있습니다. 목록에서 기존 청구서를 수정해 주세요.");
        }
        existingBill = sameMonthBills.stream().findFirst().orElse(null);

        return applyAmounts(
                existingBill == null ? new Bill() : existingBill,
                contract,
                request.billingMonth(),
                request.dueDate(),
                request.electricityUsage(),
                request.electricityTotalAmount(),
                request.waterUsage(),
                request.waterTotalAmount(),
                true
        );
    }

    @PostMapping("/bulk")
    @Transactional
    public List<Bill> createBills(@RequestBody BulkBillRequest request) {
        if (request.billingMonth() == null || !request.billingMonth().matches("\\d{4}-\\d{2}")
                || request.dueDate() == null || request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "청구월, 납부기한과 청구 자료를 입력해 주세요.");
        }
        Set<Long> contractIds = new HashSet<>();
        for (BillLineRequest item : request.items()) {
            if (item.contractId() == null || !contractIds.add(item.contractId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "같은 계약은 한 번만 선택할 수 있습니다.");
            }
            if (isNegative(item.electricityUsage()) || isNegative(item.electricityTotalAmount())
                    || isNegative(item.waterUsage()) || isNegative(item.waterTotalAmount())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용량과 공과금은 음수로 입력할 수 없습니다.");
            }
        }
        Set<Long> alreadyBilled = new HashSet<>();
        billRepository.findByBillingMonth(request.billingMonth()).forEach(bill -> alreadyBilled.add(bill.getContract().getId()));
        if (contractIds.stream().anyMatch(alreadyBilled::contains)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "해당 월에 이미 청구된 계약이 포함되어 있습니다.");
        }

        return request.items().stream().map(item -> {
            LeaseContract contract = contractRepository.findById(item.contractId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "계약을 찾을 수 없습니다."));
            return applyAmounts(new Bill(), contract, request.billingMonth(), request.dueDate(),
                    item.electricityUsage(), item.electricityTotalAmount(), item.waterUsage(), item.waterTotalAmount(), true);
        }).toList();
    }

    @PutMapping("/{id}")
    public Bill updateBill(
            @PathVariable Long id,
            @RequestBody BillUpdateRequest request
    ) {
        if (request == null || request.billingMonth() == null || !request.billingMonth().matches("\\d{4}-\\d{2}")
                || request.dueDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "청구월과 납부기한을 입력해 주세요.");
        }
        if (isNegative(request.electricityUsage()) || isNegative(request.electricityTotalAmount())
                || isNegative(request.waterUsage()) || isNegative(request.waterTotalAmount())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용량과 공과금은 음수로 입력할 수 없습니다.");
        }
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "청구서를 찾을 수 없습니다."));

        if ("완납".equals(bill.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "완납된 청구서는 수정할 수 없습니다. 납부 내역을 먼저 정정해 주세요.");
        }

        boolean duplicate = billRepository.findByBillingMonth(request.billingMonth()).stream()
                .anyMatch(other -> !other.getId().equals(id)
                        && other.getContract().getId().equals(bill.getContract().getId())
                        && !"취소".equals(other.getStatus()));
        if (duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "같은 계약의 해당 월 청구서가 이미 있습니다.");
        }

        return applyAmounts(
                bill,
                bill.getContract(),
                request.billingMonth(),
                request.dueDate(),
                request.electricityUsage(),
                request.electricityTotalAmount(),
                request.waterUsage(),
                request.waterTotalAmount(),
                false
        );
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> cancelBill(@PathVariable Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "청구서를 찾을 수 없습니다."));
        if (defaultZero(bill.getPaidAmount()).compareTo(BigDecimal.ZERO) > 0
                || !paymentRepository.findByBillId(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "message", "납부완료된 청구서는 삭제할 수 없습니다."
            ));
        }
        billRepository.delete(bill);
        return ResponseEntity.noContent().build();
    }

    private Bill applyAmounts(
            Bill bill,
            LeaseContract contract,
            String billingMonth,
            LocalDate dueDate,
            BigDecimal electricityUsage,
            BigDecimal electricityTotal,
            BigDecimal waterUsage,
            BigDecimal waterTotal,
            boolean newBill
    ) {
        BigDecimal rentTotal = defaultZero(contract.getMonthlyRent());
        BigDecimal maintenanceTotal = defaultZero(contract.getMaintenanceFee());
        BigDecimal electricityTotalAmount = defaultZero(electricityTotal);
        BigDecimal waterTotalAmount = defaultZero(waterTotal);

        BigDecimal rentVat = calculateVatFromTotal(
                rentTotal, contract.getRentVatApplicable(), contract.getRentVatRate());
        BigDecimal maintenanceVat = calculateVatFromTotal(
                maintenanceTotal, contract.getMaintenanceVatApplicable(), contract.getMaintenanceVatRate());
        BigDecimal electricityVat = calculateVatFromTotal(
                electricityTotalAmount, true, new BigDecimal("10.00"));

        BigDecimal rentAmount = rentTotal.subtract(rentVat);
        BigDecimal maintenanceAmount = maintenanceTotal.subtract(maintenanceVat);
        BigDecimal electricityAmount = electricityTotalAmount.subtract(electricityVat);
        BigDecimal waterAmount = waterTotalAmount;

        BigDecimal originalAmount = rentAmount
                .add(maintenanceAmount)
                .add(electricityAmount)
                .add(waterAmount);

        BigDecimal totalVat = rentVat
                .add(maintenanceVat)
                .add(electricityVat);

        BigDecimal totalAmount = originalAmount.add(totalVat);

        bill.setBillingMonth(billingMonth);
        bill.setDueDate(dueDate);
        bill.setRentAmount(rentAmount);
        bill.setRentVat(rentVat);
        bill.setMaintenanceFee(maintenanceAmount);
        bill.setMaintenanceVat(maintenanceVat);
        bill.setElectricityUsage(defaultZero(electricityUsage));
        bill.setElectricityAmount(electricityAmount);
        bill.setElectricityVat(electricityVat);
        bill.setWaterUsage(defaultZero(waterUsage));
        bill.setWaterAmount(waterAmount);
        bill.setOriginalAmount(originalAmount);
        bill.setTotalVat(totalVat);
        bill.setOverdueInterest(defaultZero(bill.getOverdueInterest()));
        bill.setTotalAmount(totalAmount);

        BigDecimal paidAmount = newBill
                ? BigDecimal.ZERO
                : defaultZero(bill.getPaidAmount());

        bill.setPaidAmount(paidAmount);
        bill.setUnpaidAmount(totalAmount.subtract(paidAmount).max(BigDecimal.ZERO));
        bill.setStatus(newBill ? "미납" : bill.getStatus());
        bill.setContract(contract);

        return billRepository.save(bill);
    }

    private BigDecimal defaultZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal calculateVatFromTotal(
            BigDecimal totalAmount,
            Boolean vatApplicable,
            BigDecimal vatRate
    ) {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        if (Boolean.FALSE.equals(vatApplicable)) {
            return BigDecimal.ZERO;
        }

        BigDecimal actualRate = vatRate == null
                ? new BigDecimal("10.00")
                : vatRate;

        return totalAmount
                .multiply(actualRate)
                .divide(new BigDecimal("100").add(actualRate), 0, RoundingMode.HALF_UP);
    }

    public record BillRequest(
            Long contractId,
            String billingMonth,
            LocalDate dueDate,
            BigDecimal electricityUsage,
            BigDecimal electricityTotalAmount,
            BigDecimal waterUsage,
            BigDecimal waterTotalAmount
    ) {
    }

    public record BillUpdateRequest(
            String billingMonth,
            LocalDate dueDate,
            BigDecimal electricityUsage,
            BigDecimal electricityTotalAmount,
            BigDecimal waterUsage,
            BigDecimal waterTotalAmount
    ) {
    }

    private boolean isNegative(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) < 0;
    }

    public record BulkBillRequest(String billingMonth, LocalDate dueDate, List<BillLineRequest> items) { }

    public record BillLineRequest(Long contractId, BigDecimal electricityUsage, BigDecimal electricityTotalAmount,
            BigDecimal waterUsage, BigDecimal waterTotalAmount) { }
}
