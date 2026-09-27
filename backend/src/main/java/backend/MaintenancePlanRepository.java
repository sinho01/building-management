package backend;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MaintenancePlanRepository
        extends JpaRepository<MaintenancePlan, Long> {

    List<MaintenancePlan> findByFacilityId(Long facilityId);

    long countByFacilityId(Long facilityId);

    long countByVendorId(Long vendorId);
}
