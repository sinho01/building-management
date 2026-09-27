package backend;

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
@Table(name = "maintenance_plans")
public class MaintenancePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String planName;

    private Integer cycleDays;

    private LocalDate lastInspectionDate;

    private LocalDate nextInspectionDate;

    private String status;

    private String notes;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    public MaintenancePlan() {
    }

    public Long getId() {
        return id;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public Integer getCycleDays() {
        return cycleDays;
    }

    public void setCycleDays(Integer cycleDays) {
        this.cycleDays = cycleDays;
    }

    public LocalDate getLastInspectionDate() {
        return lastInspectionDate;
    }

    public void setLastInspectionDate(
            LocalDate lastInspectionDate
    ) {
        this.lastInspectionDate = lastInspectionDate;
    }

    public LocalDate getNextInspectionDate() {
        return nextInspectionDate;
    }

    public void setNextInspectionDate(
            LocalDate nextInspectionDate
    ) {
        this.nextInspectionDate = nextInspectionDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Facility getFacility() {
        return facility;
    }

    public void setFacility(Facility facility) {
        this.facility = facility;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }
}