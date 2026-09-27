package backend;

import java.time.LocalDate;
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
@RequestMapping("/api/maintenance-plans")
@CrossOrigin(origins = "http://localhost:3000")
public class MaintenancePlanController {

    private final MaintenancePlanRepository planRepository;
    private final FacilityRepository facilityRepository;
    private final VendorRepository vendorRepository;

    public MaintenancePlanController(
            MaintenancePlanRepository planRepository,
            FacilityRepository facilityRepository,
            VendorRepository vendorRepository
    ) {
        this.planRepository = planRepository;
        this.facilityRepository = facilityRepository;
        this.vendorRepository = vendorRepository;
    }

    @GetMapping
    public List<MaintenancePlan> getPlans() {
        return planRepository.findAll();
    }

    @PostMapping
    public MaintenancePlan createPlan(
            @RequestBody MaintenancePlanRequest request
    ) {
        Facility facility = facilityRepository
                .findById(request.facilityId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "시설물을 찾을 수 없습니다."
                        )
                );

        Vendor vendor = null;

        if (request.vendorId() != null) {
            vendor = vendorRepository.findById(request.vendorId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "업체를 찾을 수 없습니다."
                            )
                    );
        }

        MaintenancePlan plan = new MaintenancePlan();

        plan.setPlanName(request.planName());
        plan.setCycleDays(request.cycleDays());
        plan.setLastInspectionDate(
                request.lastInspectionDate()
        );
        plan.setNextInspectionDate(
                request.nextInspectionDate()
        );
        plan.setStatus(request.status());
        plan.setNotes(request.notes());
        plan.setFacility(facility);
        plan.setVendor(vendor);

        return planRepository.save(plan);
    }

    @PutMapping("/{id}")
    public MaintenancePlan updatePlan(
            @PathVariable Long id,
            @RequestBody MaintenancePlanRequest request
    ) {
        MaintenancePlan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance plan not found."));
        Facility facility = facilityRepository.findById(request.facilityId())
                .orElseThrow(() -> new RuntimeException("Facility not found."));
        Vendor vendor = request.vendorId() == null ? null : vendorRepository.findById(request.vendorId())
                .orElseThrow(() -> new RuntimeException("Vendor not found."));
        plan.setFacility(facility);
        plan.setVendor(vendor);
        plan.setPlanName(request.planName());
        plan.setCycleDays(request.cycleDays());
        plan.setLastInspectionDate(request.lastInspectionDate());
        plan.setNextInspectionDate(request.nextInspectionDate());
        plan.setStatus(request.status());
        plan.setNotes(request.notes());
        return planRepository.save(plan);
    }

    @DeleteMapping("/{id}")
    public void deletePlan(@PathVariable Long id) {
        MaintenancePlan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance plan not found."));
        planRepository.delete(plan);
    }

    public record MaintenancePlanRequest(
            Long facilityId,
            Long vendorId,
            String planName,
            Integer cycleDays,
            LocalDate lastInspectionDate,
            LocalDate nextInspectionDate,
            String status,
            String notes
    ) {
    }
}
