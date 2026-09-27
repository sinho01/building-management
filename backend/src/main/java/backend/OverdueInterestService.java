package backend;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OverdueInterestService {

    private final BillRepository billRepository;

    public OverdueInterestService(BillRepository billRepository) {
        this.billRepository = billRepository;
    }

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void calculateAllOverdueInterest() {
        List<Bill> bills = billRepository.findAll();

        for (Bill bill : bills) {
            calculateForBill(bill);
        }
    }

    @Transactional
    public Bill calculateForBill(Bill bill) {
        LocalDate today = LocalDate.now();
        LocalDate dueDate = bill.getDueDate();

        BigDecimal originalAmount = bill.getOriginalAmount();

        if (originalAmount == null) {
            originalAmount = BigDecimal.ZERO;
        }

        BigDecimal paidAmount = bill.getPaidAmount();

        if (paidAmount == null) {
            paidAmount = BigDecimal.ZERO;
        }

        BigDecimal overdueInterest = BigDecimal.ZERO;

        if (dueDate != null
                && today.isAfter(dueDate)
                && paidAmount.compareTo(originalAmount) < 0) {

            long overdueDays =
                    ChronoUnit.DAYS.between(dueDate, today);

            BigDecimal unpaidPrincipal =
                    originalAmount.subtract(paidAmount);

            BigDecimal overdueRate =
                    bill.getContract().getOverdueRate();

            if (overdueRate == null) {
                overdueRate = new BigDecimal("5.00");
            }

            overdueInterest = unpaidPrincipal
                    .multiply(overdueRate)
                    .divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(overdueDays))
                    .divide(new BigDecimal("365"), 0, RoundingMode.HALF_UP);
        }

        BigDecimal totalAmount =
                originalAmount.add(overdueInterest);

        BigDecimal unpaidAmount =
                totalAmount.subtract(paidAmount);

        if (unpaidAmount.compareTo(BigDecimal.ZERO) < 0) {
            unpaidAmount = BigDecimal.ZERO;
        }

        bill.setOverdueInterest(overdueInterest);
        bill.setTotalAmount(totalAmount);
        bill.setUnpaidAmount(unpaidAmount);

        if (unpaidAmount.compareTo(BigDecimal.ZERO) == 0) {
            bill.setStatus("완납");
        } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            bill.setStatus("일부 납부");
        } else if (overdueInterest.compareTo(BigDecimal.ZERO) > 0) {
            bill.setStatus("연체");
        } else {
            bill.setStatus("미납");
        }

        return billRepository.save(bill);
    }
}