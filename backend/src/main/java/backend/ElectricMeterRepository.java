package backend;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ElectricMeterRepository extends JpaRepository<ElectricMeter, Long> {
    List<ElectricMeter> findAllByOrderByMeterPositionAscMeterNameAsc();
    boolean existsByMeterPositionAndMeterName(String meterPosition, String meterName);
}
