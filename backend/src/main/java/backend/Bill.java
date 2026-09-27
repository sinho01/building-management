package backend;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "bills")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String billingMonth;

    private LocalDate dueDate;

    private BigDecimal rentAmount;

    private BigDecimal maintenanceFee;

     private BigDecimal originalAmount;

    private BigDecimal overdueInterest;

    private BigDecimal totalAmount;

    private String status;

    private BigDecimal paidAmount;

    private BigDecimal unpaidAmount;
        
    private BigDecimal maintenanceVat;

    private BigDecimal rentVat;

    private BigDecimal totalVat;    

    private BigDecimal electricityUsage;
    private BigDecimal electricityAmount;
    private BigDecimal electricityVat;

    private BigDecimal waterUsage;
    private BigDecimal waterAmount;

    private LocalDate createdAt;

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }

    public BigDecimal getElectricityUsage() {
        return electricityUsage;
    }

    public void setElectricityUsage(BigDecimal electricityUsage) {
        this.electricityUsage = electricityUsage;
    }

    public BigDecimal getWaterUsage() {
        return waterUsage;
    }

    public void setWaterUsage(BigDecimal waterUsage) {
        this.waterUsage = waterUsage;
    }


    public BigDecimal getElectricityAmount() {
        return electricityAmount;
    }

    public void setElectricityAmount(BigDecimal electricityAmount) {
        this.electricityAmount = electricityAmount;
    }

    public BigDecimal getElectricityVat() {
        return electricityVat;
    }

    public void setElectricityVat(BigDecimal electricityVat) {
        this.electricityVat = electricityVat;
    }

    public BigDecimal getWaterAmount() {
        return waterAmount;
    }

    public void setWaterAmount(BigDecimal waterAmount) {
        this.waterAmount = waterAmount;
    }

    public BigDecimal getTotalVat() {
        return totalVat;
    }

    public void setTotalVat(BigDecimal totalVat) {
        this.totalVat = totalVat;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public BigDecimal getUnpaidAmount() {
        return unpaidAmount;
    }

    public void setUnpaidAmount(BigDecimal unpaidAmount) {
        this.unpaidAmount = unpaidAmount;
    }

    public BigDecimal getRentVat() {
        return rentVat;
    }

    public void setRentVat(BigDecimal rentVat) {
        this.rentVat = rentVat;
    }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "contract_id", nullable = false)
    private LeaseContract contract;

    public Bill() {
    }

    public Long getId() {
        return id;
    }

    public String getBillingMonth() {
        return billingMonth;
    }

    public void setBillingMonth(String billingMonth) {
        this.billingMonth = billingMonth;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public BigDecimal getRentAmount() {
        return rentAmount;
    }

    public void setRentAmount(BigDecimal rentAmount) {
        this.rentAmount = rentAmount;
    }

    public BigDecimal getMaintenanceFee() {
        return maintenanceFee;
    }

    public void setMaintenanceFee(BigDecimal maintenanceFee) {
        this.maintenanceFee = maintenanceFee;
    }

    public BigDecimal getOriginalAmount() {
        return originalAmount;
    }

    public void setOriginalAmount(BigDecimal originalAmount) {
        this.originalAmount = originalAmount;
    }

    public BigDecimal getOverdueInterest() {
        return overdueInterest;
    }

    public void setOverdueInterest(BigDecimal overdueInterest) {
        this.overdueInterest = overdueInterest;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LeaseContract getContract() {
        return contract;
    }

    public void setContract(LeaseContract contract) {
        this.contract = contract;
    }

    public BigDecimal getMaintenanceVat() {
        return maintenanceVat;
    }

    public void setMaintenanceVat(BigDecimal maintenanceVat) {
        this.maintenanceVat = maintenanceVat;
    }    
}