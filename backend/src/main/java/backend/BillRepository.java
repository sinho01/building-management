package backend;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BillRepository extends JpaRepository<Bill, Long> {

    List<Bill> findByBillingMonth(String billingMonth);

    long countByContractId(Long contractId);
}
