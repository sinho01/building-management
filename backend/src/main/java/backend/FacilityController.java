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
@RequestMapping("/api/facilities")
@CrossOrigin(origins = "http://localhost:3000")
public class FacilityController {

    private final FacilityRepository facilityRepository;
    private final BuildingRepository buildingRepository;
    private final MaintenanceHistoryRepository historyRepository;
    private final MaintenancePlanRepository planRepository;

    public FacilityController(
            FacilityRepository facilityRepository,
            BuildingRepository buildingRepository,
            MaintenanceHistoryRepository historyRepository,
            MaintenancePlanRepository planRepository
    ) {
        this.facilityRepository = facilityRepository;
        this.buildingRepository = buildingRepository;
        this.historyRepository = historyRepository;
        this.planRepository = planRepository;
    }

    @GetMapping
    public List<Facility> getFacilities() {
        return facilityRepository.findAll();
    }

    @GetMapping("/building/{buildingId}")
    public List<Facility> getFacilitiesByBuilding(
            @PathVariable Long buildingId
    ) {
        return facilityRepository.findByBuildingId(buildingId);
    }

    @PostMapping
    public Facility createFacility(
            @RequestBody FacilityRequest request
    ) {
        Building building = buildingRepository
                .findById(request.buildingId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "건물을 찾을 수 없습니다."
                        )
                );

        Facility facility = new Facility();

        facility.setName(request.name());
        facility.setFacilityType(request.facilityType());
        facility.setLocation(request.location());
        facility.setManufacturer(request.manufacturer());
        facility.setModelName(request.modelName());
        facility.setInstalledDate(request.installedDate());
        facility.setInspectionCycleDays(
                request.inspectionCycleDays()
        );
        facility.setStatus(request.status());
        facility.setNotes(request.notes());
        facility.setBuilding(building);

        return facilityRepository.save(facility);
    }

    @PutMapping("/{id}")
    public Facility updateFacility(
            @PathVariable Long id,
            @RequestBody FacilityRequest request
    ) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility not found."));
        Building building = buildingRepository.findById(request.buildingId())
                .orElseThrow(() -> new RuntimeException("Building not found."));
        facility.setName(request.name());
        facility.setFacilityType(request.facilityType());
        facility.setLocation(request.location());
        facility.setManufacturer(request.manufacturer());
        facility.setModelName(request.modelName());
        facility.setInstalledDate(request.installedDate());
        facility.setInspectionCycleDays(request.inspectionCycleDays());
        facility.setStatus(request.status());
        facility.setNotes(request.notes());
        facility.setBuilding(building);
        return facilityRepository.save(facility);
    }

    @DeleteMapping("/{id}")
    public void deleteFacility(@PathVariable Long id) {
        if (historyRepository.countByFacilityId(id) > 0 || planRepository.countByFacilityId(id) > 0) {
            throw new RuntimeException("A facility with maintenance records cannot be deleted.");
        }
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility not found."));
        facilityRepository.delete(facility);
    }

    public record FacilityRequest(
            Long buildingId,
            String name,
            String facilityType,
            String location,
            String manufacturer,
            String modelName,
            java.time.LocalDate installedDate,
            Integer inspectionCycleDays,
            String status,
            String notes
    ) {
    }
}
