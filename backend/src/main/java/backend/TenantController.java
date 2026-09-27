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
@RequestMapping("/api/tenants")
@CrossOrigin(origins = "http://localhost:3000")
public class TenantController {

    private final TenantRepository tenantRepository;
    private final LeaseContractRepository contractRepository;

    public TenantController(
            TenantRepository tenantRepository,
            LeaseContractRepository contractRepository
    ) {
        this.tenantRepository = tenantRepository;
        this.contractRepository = contractRepository;
    }

    @GetMapping
    public List<Tenant> getTenants() {
        return tenantRepository.findAll();
    }

    @GetMapping("/{id}")
    public Tenant getTenant(@PathVariable Long id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("임차인을 찾을 수 없습니다."));
    }

    @PostMapping
    public Tenant createTenant(@RequestBody Tenant tenant) {
        return tenantRepository.save(tenant);
    }

    @PutMapping("/{id}")
    public Tenant updateTenant(
            @PathVariable Long id,
            @RequestBody Tenant request
    ) {
        Tenant tenant = getTenant(id);
        tenant.setName(request.getName());
        tenant.setPhone(request.getPhone());
        tenant.setEmail(request.getEmail());
        tenant.setAddress(request.getAddress());
        if (request.getResidentNumber() != null && !request.getResidentNumber().isBlank()) {
            tenant.setResidentNumber(request.getResidentNumber());
        }
        return tenantRepository.save(tenant);
    }

    @DeleteMapping("/{id}")
    public void deleteTenant(@PathVariable Long id) {
        if (contractRepository.countByTenantId(id) > 0) {
            throw new RuntimeException("A tenant with contracts cannot be deleted.");
        }
        tenantRepository.delete(getTenant(id));
    }
}
