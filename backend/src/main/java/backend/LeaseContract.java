package backend;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "lease_contracts")
public class LeaseContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "business_number", length = 30)
    private String businessNumber;

    private LocalDate contractStartDate;

    private LocalDate contractEndDate;

    private BigDecimal depositAmount;

    private BigDecimal monthlyRent;

    private BigDecimal maintenanceFee;

    private Integer paymentDay;

    private BigDecimal overdueRate;

    private String status;

    private Boolean maintenanceVatApplicable;

    private BigDecimal maintenanceVatRate;    

    private Boolean rentVatApplicable;

    private BigDecimal rentVatRate;

    private LocalDate moveInDate;

    private BigDecimal contractArea;

    private BigDecimal contractPyeong;

    private String specialNotes;    

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    public LeaseContract() {
    }

    public Long getId() {
        return id;
    }
    
    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getBusinessNumber() {
        return businessNumber;
    }

    public void setBusinessNumber(String businessNumber) {
        this.businessNumber = businessNumber;
    }

    public LocalDate getContractStartDate() {
        return contractStartDate;
    }

    public void setContractStartDate(LocalDate contractStartDate) {
        this.contractStartDate = contractStartDate;
    }

    public LocalDate getContractEndDate() {
        return contractEndDate;
    }

    public void setContractEndDate(LocalDate contractEndDate) {
        this.contractEndDate = contractEndDate;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public BigDecimal getMonthlyRent() {
        return monthlyRent;
    }

    public void setMonthlyRent(BigDecimal monthlyRent) {
        this.monthlyRent = monthlyRent;
    }

    public BigDecimal getMaintenanceFee() {
        return maintenanceFee;
    }

    public void setMaintenanceFee(BigDecimal maintenanceFee) {
        this.maintenanceFee = maintenanceFee;
    }

    public Integer getPaymentDay() {
        return paymentDay;
    }

    public void setPaymentDay(Integer paymentDay) {
        this.paymentDay = paymentDay;
    }

    public BigDecimal getOverdueRate() {
        return overdueRate;
    }

    public void setOverdueRate(BigDecimal overdueRate) {
        this.overdueRate = overdueRate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Building getBuilding() {
        return building;
    }

    public void setBuilding(Building building) {
        this.building = building;
    }

    public Unit getUnit() {
        return unit;
    }

    public void setUnit(Unit unit) {
        this.unit = unit;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }
    public void setMaintenanceVatApplicable(
            Boolean maintenanceVatApplicable
    ) {
        this.maintenanceVatApplicable = maintenanceVatApplicable;
    }

    public BigDecimal getMaintenanceVatRate() {
        return maintenanceVatRate;
    }

    public void setMaintenanceVatRate(
            BigDecimal maintenanceVatRate
    ) {
        this.maintenanceVatRate = maintenanceVatRate;
    }    

    public Boolean getRentVatApplicable() {
            return rentVatApplicable;
    }

    public void setRentVatApplicable(Boolean rentVatApplicable) {
    this.rentVatApplicable = rentVatApplicable;
    }

    public BigDecimal getRentVatRate() {
        return rentVatRate;
    }

    public void setRentVatRate(BigDecimal rentVatRate) {
        this.rentVatRate = rentVatRate;
    }

    public Boolean getMaintenanceVatApplicable() {
        return maintenanceVatApplicable;
    }

    public LocalDate getMoveInDate() {
        return moveInDate;
    }

    public void setMoveInDate(LocalDate moveInDate) {
        this.moveInDate = moveInDate;
    }

    public BigDecimal getContractArea() {
        return contractArea;
    }

    public void setContractArea(BigDecimal contractArea) {
        this.contractArea = contractArea;
    }

    public BigDecimal getContractPyeong() {
        return contractPyeong;
    }

    public void setContractPyeong(BigDecimal contractPyeong) {
        this.contractPyeong = contractPyeong;
    }

    public String getSpecialNotes() {
        return specialNotes;
    }

    public void setSpecialNotes(String specialNotes) {
        this.specialNotes = specialNotes;
    }

}