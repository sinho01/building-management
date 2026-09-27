package backend;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UnitRepository
        extends JpaRepository<Unit, Long> {

    List<Unit> findByBuildingId(Long buildingId);

    long countByBuildingId(Long buildingId);
}