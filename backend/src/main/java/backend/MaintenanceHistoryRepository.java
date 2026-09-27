package backend;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MaintenanceHistoryRepository
        extends JpaRepository<MaintenanceHistory, Long> {

    List<MaintenanceHistory> findByFacilityId(Long facilityId);

    long countByFacilityId(Long facilityId);

    long countByVendorId(Long vendorId);
}
