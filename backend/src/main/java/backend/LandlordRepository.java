package backend;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LandlordRepository
        extends JpaRepository<Landlord, Long> {
}