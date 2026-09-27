package backend;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.PatchMapping;


@RestController
@RequestMapping("/api/buildings")
@CrossOrigin(origins = "http://localhost:3000")
public class BuildingController {

    private final BuildingRepository buildingRepository;
    private final UnitRepository unitRepository;

    public BuildingController(
            BuildingRepository buildingRepository,
            UnitRepository unitRepository
    ) {
        this.buildingRepository = buildingRepository;
        this.unitRepository = unitRepository;
    }

    @GetMapping
    public List<Building> getBuildings() {
        return buildingRepository.findAll();
    }

    @GetMapping("/{id}")
    public Building getBuilding(@PathVariable Long id) {
        return buildingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("건물을 찾을 수 없습니다."));
    }

    @PostMapping
    public Building createBuilding(@RequestBody Building building) {
        if (building.getStatus() == null || building.getStatus().isBlank()) {
            building.setStatus("관리 중");
        }

        return buildingRepository.save(building);
    }

    @PutMapping("/{id}")
    public Building updateBuilding(
            @PathVariable Long id,
            @RequestBody Building request
    ) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "건물을 찾을 수 없습니다."
                        )
                );

        building.setName(request.getName());
        building.setAddress(request.getAddress());
        building.setFloors(request.getFloors());
        building.setUnits(request.getUnits());
        building.setStatus(request.getStatus());

        if (request.getLandlord() != null) {
            building.setLandlord(request.getLandlord());
        }

        return buildingRepository.save(building);
    }

    @DeleteMapping("/{id}")
    public void deleteBuilding(@PathVariable Long id) {
        long unitCount =
                unitRepository.countByBuildingId(id);

        if (unitCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "호실이 등록된 건물은 삭제할 수 없습니다."
            );
        }

        Building building = buildingRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "건물을 찾을 수 없습니다."
                        )
                );

        buildingRepository.delete(building);
    }

    @PatchMapping("/{id}/status")
    public Building updateBuildingStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request
    ) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "건물을 찾을 수 없습니다."
                        )
                );

        building.setStatus(request.status());

        return buildingRepository.save(building);
    }

    public record StatusRequest(String status) {
    }
    
}