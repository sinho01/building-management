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
@RequestMapping("/api/vendors")
@CrossOrigin(origins = "http://localhost:3000")
public class VendorController {

    private final VendorRepository vendorRepository;
    private final MaintenanceHistoryRepository historyRepository;
    private final MaintenancePlanRepository planRepository;

    public VendorController(
            VendorRepository vendorRepository,
            MaintenanceHistoryRepository historyRepository,
            MaintenancePlanRepository planRepository
    ) {
        this.vendorRepository = vendorRepository;
        this.historyRepository = historyRepository;
        this.planRepository = planRepository;
    }

    @GetMapping
    public List<Vendor> getVendors() {
        return vendorRepository.findAll();
    }

    @GetMapping("/{id}")
    public Vendor getVendor(@PathVariable Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "업체를 찾을 수 없습니다."
                        )
                );
    }

    @PostMapping
    public Vendor createVendor(@RequestBody Vendor vendor) {
        return vendorRepository.save(vendor);
    }

    @PutMapping("/{id}")
    public Vendor updateVendor(
            @PathVariable Long id,
            @RequestBody Vendor request
    ) {
        Vendor vendor = getVendor(id);
        vendor.setName(request.getName());
        vendor.setVendorType(request.getVendorType());
        vendor.setContactName(request.getContactName());
        vendor.setPhone(request.getPhone());
        vendor.setEmail(request.getEmail());
        vendor.setBusinessNumber(request.getBusinessNumber());
        vendor.setAddress(request.getAddress());
        vendor.setNotes(request.getNotes());
        return vendorRepository.save(vendor);
    }

    @DeleteMapping("/{id}")
    public void deleteVendor(@PathVariable Long id) {
        if (historyRepository.countByVendorId(id) > 0 || planRepository.countByVendorId(id) > 0) {
            throw new RuntimeException("A vendor with maintenance records cannot be deleted.");
        }
        vendorRepository.delete(getVendor(id));
    }
}
