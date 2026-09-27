package backend;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ElectricMeterReadingRepository extends JpaRepository<ElectricMeterReading, Long> {
    List<ElectricMeterReading> findByBillingMonth(String billingMonth);
    List<ElectricMeterReading> findByBillingMonthOrderByMeter_MeterPositionAsc(String billingMonth);
    List<ElectricMeterReading> findByMeterIdAndBillingMonth(Long meterId, String billingMonth);
}
