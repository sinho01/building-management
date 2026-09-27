package backend;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "jumin_number", length = 20)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String juminNumber;

    private String name;

    private String phone;

    private String email;

    private String address;

    public Tenant() {
    }

    public Long getId() {
        return id;
    }
    public String getResidentNumber() {
        return juminNumber;
    }

    public void setResidentNumber(String juminNumber) {
        this.juminNumber = juminNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}