package backend;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UtilityReadingRepository
        extends JpaRepository<UtilityReading, Long> {

    List<UtilityReading> findByUnitId(Long unitId);
}