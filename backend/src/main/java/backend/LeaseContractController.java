package backend;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contracts")
@CrossOrigin(origins = "http://localhost:3000")
public class LeaseContractController {

    private final LeaseContractRepository contractRepository;
    private final BuildingRepository buildingRepository;
    private final UnitRepository unitRepository;
    private final TenantRepository tenantRepository;
    private final BillRepository billRepository;

    public LeaseContractController(
            LeaseContractRepository contractRepository,
            BuildingRepository buildingRepository,
            UnitRepository unitRepository,
            TenantRepository tenantRepository,
            BillRepository billRepository
    ) {
        this.contractRepository = contractRepository;
        this.buildingRepository = buildingRepository;
        this.unitRepository = unitRepository;
        this.tenantRepository = tenantRepository;
        this.billRepository = billRepository;
    }

    @GetMapping
    public List<LeaseContract> getContracts() {
        return contractRepository.findAll();
    }
    @GetMapping("/{id}")
    public LeaseContract getContract(@PathVariable Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "계약을 찾을 수 없습니다."
                        )
                );
        }
    @PostMapping
    public LeaseContract createContract(
            @RequestBody ContractRequest request
    ) {
        Building building = buildingRepository.findById(request.buildingId())
                .orElseThrow(() -> new RuntimeException("건물을 찾을 수 없습니다."));

        Unit unit = unitRepository.findById(request.unitId())
                .orElseThrow(() -> new RuntimeException("호실을 찾을 수 없습니다."));

        Tenant tenant = tenantRepository.findById(request.tenantId())
                .orElseThrow(() -> new RuntimeException("임차인을 찾을 수 없습니다."));

        LeaseContract contract = new LeaseContract();

        contract.setBuilding(building);
        contract.setUnit(unit);
        contract.setTenant(tenant);
        contract.setContractStartDate(request.contractStartDate());
        contract.setContractEndDate(request.contractEndDate());
        contract.setMoveInDate(request.moveInDate());

        contract.setCompanyName(request.companyName());
        contract.setBusinessNumber(request.businessNumber());        
        
        contract.setContractArea(request.contractArea());
        contract.setContractPyeong(request.contractPyeong());

        contract.setDepositAmount(request.depositAmount());
        contract.setMonthlyRent(request.monthlyRent());
        contract.setMaintenanceFee(request.maintenanceFee());
        contract.setSpecialNotes(request.specialNotes());       
        contract.setPaymentDay(request.paymentDay());

        contract.setOverdueRate(
                request.overdueRate() == null
                        ? new BigDecimal("5.00")
                        : request.overdueRate()
        );

        contract.setRentVatApplicable(true);
        contract.setRentVatRate(new BigDecimal("10.00"));

        contract.setMaintenanceVatApplicable(true);
        contract.setMaintenanceVatRate(new BigDecimal("10.00"));

        contract.setStatus("계약 중");

        return contractRepository.save(contract);
    }

    @PutMapping("/{id}")
    public LeaseContract updateContract(
            @PathVariable Long id,
            @RequestBody ContractRequest request
    ) {
        LeaseContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Contract not found."
                ));

        Building building = buildingRepository.findById(request.buildingId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Building not found."
                ));
        Unit unit = unitRepository.findById(request.unitId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Unit not found."
                ));
        Tenant tenant = tenantRepository.findById(request.tenantId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Tenant not found."
                ));

        contract.setBuilding(building);
        contract.setUnit(unit);
        contract.setTenant(tenant);
        contract.setCompanyName(request.companyName());
        contract.setBusinessNumber(request.businessNumber());
        contract.setContractStartDate(request.contractStartDate());
        contract.setContractEndDate(request.contractEndDate());
        contract.setMoveInDate(request.moveInDate());
        contract.setContractArea(request.contractArea());
        contract.setContractPyeong(request.contractPyeong());
        contract.setDepositAmount(request.depositAmount());
        contract.setMonthlyRent(request.monthlyRent());
        contract.setMaintenanceFee(request.maintenanceFee());
        contract.setPaymentDay(request.paymentDay());
        contract.setOverdueRate(request.overdueRate());
        contract.setSpecialNotes(request.specialNotes());

        return contractRepository.save(contract);
    }

    @DeleteMapping("/{id}")
    public void deleteContract(@PathVariable Long id) {
        LeaseContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Contract not found."
                ));

        if (billRepository.countByContractId(id) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A contract with billing history cannot be deleted."
            );
        }

        contractRepository.delete(contract);
    }

    public record ContractRequest(
        Long buildingId,
        Long unitId,
        Long tenantId,
        String companyName,
        String businessNumber,
        LocalDate contractStartDate,
        LocalDate contractEndDate,
        LocalDate moveInDate,
        BigDecimal contractArea,
        BigDecimal contractPyeong,
        BigDecimal depositAmount,
        BigDecimal monthlyRent,
        BigDecimal maintenanceFee,
        Integer paymentDay,
        BigDecimal overdueRate,
        String specialNotes
) {
}
    }
