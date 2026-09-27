package backend;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/buildings/{buildingId}/units")
@CrossOrigin(origins = "http://localhost:3000")
public class UnitController {

    private final UnitRepository unitRepository;
    private final BuildingRepository buildingRepository;
    private final LeaseContractRepository contractRepository;

    public UnitController(
            UnitRepository unitRepository,
            BuildingRepository buildingRepository,
            LeaseContractRepository contractRepository
    ) {
        this.unitRepository = unitRepository;
        this.buildingRepository = buildingRepository;
        this.contractRepository = contractRepository;
    }

    @GetMapping
    public List<Unit> getUnits(@PathVariable Long buildingId) {
        return unitRepository.findByBuildingId(buildingId);
    }

    @PostMapping
    public Unit createUnit(
            @PathVariable Long buildingId,
            @RequestBody UnitRequest request
    ) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new RuntimeException("건물을 찾을 수 없습니다."));

        Unit unit = new Unit();
        unit.setFloor(request.floor());
        unit.setUnitNumber(request.unitNumber());
        unit.setArea(request.area());
        unit.setStatus(request.status());
        unit.setTenantName(request.tenantName());
        unit.setBuilding(building);

        return unitRepository.save(unit);
    }

    @PutMapping("/{id}")
    public Unit updateUnit(
            @PathVariable Long id,
            @RequestBody UnitRequest request
    ) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "호실을 찾을 수 없습니다."
                        )
                );

        unit.setFloor(request.floor());
        unit.setUnitNumber(request.unitNumber());
        unit.setArea(request.area());
        unit.setStatus(request.status());
        unit.setTenantName(request.tenantName());

        return unitRepository.save(unit);
    }

    @DeleteMapping("/{id}")
    public void deleteUnit(@PathVariable Long id) {
        long contractCount =
                contractRepository.countByUnitId(id);

        if (contractCount > 0) {
            throw new RuntimeException(
                    "계약이 연결된 호실은 삭제할 수 없습니다."
            );
        }

        Unit unit = unitRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "호실을 찾을 수 없습니다."
                        )
                );

        unitRepository.delete(unit);
    }

    public record UnitRequest(
            Integer floor,
            String unitNumber,
            Double area,
            String status,
            String tenantName
    ) {
    }
}