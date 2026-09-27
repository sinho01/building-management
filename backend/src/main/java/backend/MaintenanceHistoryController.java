package backend;

import java.math.BigDecimal;
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
@RequestMapping("/api/maintenance-history")
@CrossOrigin(origins = "http://localhost:3000")
public class MaintenanceHistoryController {

    private final MaintenanceHistoryRepository historyRepository;
    private final FacilityRepository facilityRepository;
    private final VendorRepository vendorRepository;

    public MaintenanceHistoryController(
            MaintenanceHistoryRepository historyRepository,
            FacilityRepository facilityRepository,
            VendorRepository vendorRepository
    ) {
        this.historyRepository = historyRepository;
        this.facilityRepository = facilityRepository;
        this.vendorRepository = vendorRepository;
    }

    @GetMapping
    public List<MaintenanceHistory> getHistory() {
        return historyRepository.findAll();
    }

    @PostMapping
    public MaintenanceHistory createHistory(
            @RequestBody MaintenanceHistoryRequest request
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

        MaintenanceHistory history =
                new MaintenanceHistory();

        history.setInspectionDate(
                request.inspectionDate()
        );
        history.setInspectionType(
                request.inspectionType()
        );
        history.setResult(request.result());
        history.setActionTaken(request.actionTaken());
        history.setCost(request.cost());
        history.setNextInspectionDate(
                request.nextInspectionDate()
        );
        history.setNotes(request.notes());
        history.setFacility(facility);
        history.setVendor(vendor);

        return historyRepository.save(history);
    }

    @PutMapping("/{id}")
    public MaintenanceHistory updateHistory(
            @PathVariable Long id,
            @RequestBody MaintenanceHistoryRequest request
    ) {
        MaintenanceHistory history = historyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance history not found."));
        Facility facility = facilityRepository.findById(request.facilityId())
                .orElseThrow(() -> new RuntimeException("Facility not found."));
        Vendor vendor = request.vendorId() == null ? null : vendorRepository.findById(request.vendorId())
                .orElseThrow(() -> new RuntimeException("Vendor not found."));
        history.setFacility(facility);
        history.setVendor(vendor);
        history.setInspectionDate(request.inspectionDate());
        history.setInspectionType(request.inspectionType());
        history.setResult(request.result());
        history.setActionTaken(request.actionTaken());
        history.setCost(request.cost());
        history.setNextInspectionDate(request.nextInspectionDate());
        history.setNotes(request.notes());
        return historyRepository.save(history);
    }

    @DeleteMapping("/{id}")
    public void deleteHistory(@PathVariable Long id) {
        MaintenanceHistory history = historyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance history not found."));
        historyRepository.delete(history);
    }

    public record MaintenanceHistoryRequest(
            Long facilityId,
            Long vendorId,
            LocalDate inspectionDate,
            String inspectionType,
            String result,
            String actionTaken,
            BigDecimal cost,
            LocalDate nextInspectionDate,
            String notes
    ) {
    }
}
