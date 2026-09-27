package backend;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BuildingRepository extends JpaRepository<Building, Long> {
    long countByLandlordId(Long landlordId);
}
