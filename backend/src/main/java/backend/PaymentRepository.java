package backend;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    List<Payment> findByBillId(Long billId);

    Optional<Payment> findFirstByBillIdOrderByIdDesc(Long billId);
}
