package backend;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaseContractRepository
        extends JpaRepository<LeaseContract, Long> {

    long countByUnitId(Long unitId);

    long countByTenantId(Long tenantId);
}
