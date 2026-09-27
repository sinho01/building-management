package backend;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/landlords")
@CrossOrigin(origins = "http://localhost:3000")
public class LandlordController {

    private final LandlordRepository landlordRepository;
    private final BuildingRepository buildingRepository;

    public LandlordController(
            LandlordRepository landlordRepository,
            BuildingRepository buildingRepository
    ) {
        this.landlordRepository = landlordRepository;
        this.buildingRepository = buildingRepository;
    }

    @GetMapping
    public List<Landlord> getLandlords() {
        return landlordRepository.findAll();
    }

    @GetMapping("/{id}")
    public Landlord getLandlord(@PathVariable Long id) {
        return landlordRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "임대인을 찾을 수 없습니다."
                        )
                );
    }

    @PostMapping
    public Landlord createLandlord(
            @RequestBody Landlord landlord
    ) {
        return landlordRepository.save(landlord);
    }

    @PutMapping("/{id}")
    public Landlord updateLandlord(
            @PathVariable Long id,
            @RequestBody Landlord request
    ) {
        Landlord landlord = getLandlord(id);
        landlord.setName(request.getName());
        landlord.setPhone(request.getPhone());
        landlord.setEmail(request.getEmail());
        landlord.setBusinessNumber(request.getBusinessNumber());
        landlord.setAddress(request.getAddress());
        landlord.setBankName(request.getBankName());
        landlord.setAccountNumber(request.getAccountNumber());
        landlord.setAccountHolder(request.getAccountHolder());
        return landlordRepository.save(landlord);
    }

    @DeleteMapping("/{id}")
    public void deleteLandlord(@PathVariable Long id) {
        if (buildingRepository.countByLandlordId(id) > 0) {
            throw new RuntimeException("A landlord assigned to a building cannot be deleted.");
        }
        landlordRepository.delete(getLandlord(id));
    }
}
