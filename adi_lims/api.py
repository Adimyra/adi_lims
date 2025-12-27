# -*- coding: utf-8 -*-
# Copyright (c) 2023, Adimyra Systems and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

@frappe.whitelist()
def get_doctype_counts():
    """
    Returns counts for key LIMS doctypes for the dashboard.
    """
    counts = {
        "total_samples": frappe.db.count("Sample"),
        "samples_in_progress": frappe.db.count("Sample", {"status": "In-Progress"}),
        "reports_pending": frappe.db.count("Sample", {"status": "In-Progress"}) # Placeholder for actual reports logic
    }
    return counts

@frappe.whitelist()
def get_recent_activity():
    """
    Returns a list of recent activities for the dashboard.
    This is a placeholder and should be replaced with actual activity logging.
    """
    # For now, return static data or simple recent sample updates
    activities = frappe.get_list(
        "Sample",
        fields=["name", "sample_name", "status", "modified"],
        limit=5,
        order_by="modified desc"
    )
    return activities

@frappe.whitelist()
def create_new_patient(data):
    """
    Creates a new Patient document.
    Expects data as a dictionary.
    """
    try:
        # Assuming Patient DocType exists, either from Healthcare or a custom one
        doc = frappe.new_doc("Patient")
        doc.update(data)
        doc.insert()
        frappe.db.commit()
        return {"status": "success", "message": "Patient created successfully", "name": doc.name}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "create_new_patient")
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def create_new_sample(data):
    """
    Creates a new Sample document.
    Expects data as a dictionary.
    """
    try:
        doc = frappe.new_doc("Sample")
        doc.update(data)
        doc.insert()
        frappe.db.commit()
        return {"status": "success", "message": "Sample created successfully", "name": doc.name}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "create_new_sample")
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def get_patients_for_listing(filters=None, start=0, page_len=20):
    """
    Returns a list of patients for the patient management view.
    Filters and pagination can be applied.
    """
    if filters is None:
        filters = {}

    patients = frappe.get_list(
        "Patient",
        filters=filters,
        fields=["name", "first_name", "last_name", "gender", "dob", "mobile_no"],
        start=start,
        page_length=page_len,
        order_by="creation desc"
    )
    total_count = frappe.db.count("Patient", filters=filters)
    return {"data": patients, "total_count": total_count}

@frappe.whitelist()
def get_samples_for_listing(filters=None, start=0, page_len=20):
    """
    Returns a list of samples for the sample management view.
    Filters and pagination can be applied.
    """
    if filters is None:
        filters = {}

    samples = frappe.get_list(
        "Sample",
        filters=filters,
        fields=["name", "sample_name", "sample_type", "collection_date", "received_date", "status"],
        start=start,
        page_length=page_len,
        order_by="creation desc"
    )
    total_count = frappe.db.count("Sample", filters=filters)
    return {"data": samples, "total_count": total_count}

@frappe.whitelist()
def get_samples_for_result_entry():
    """
    Returns samples with status 'In-Progress' and their associated Lab Test Results
    for result entry.
    """
    samples = frappe.get_list(
        "Sample",
        filters={"status": "In-Progress"},
        fields=["name", "sample_name", "status"],
        limit=20, # Limit for performance, can be paginated later
        order_by="modified asc"
    )

    for sample in samples:
        sample.sample_test_results = frappe.get_list(
            "Lab Test Result",
            filters={"parent": sample.name, "status": ("in", ["Pending", "Completed"])}, # Include completed for review/edit
            fields=["name", "lab_test", "result_value", "numeric_result_value", "unit", "reference_range", "status", "analyst"],
            order_by="creation asc"
        )
        # Fetch reference range if not already set (e.g. from Lab Test DocType)
        for test_result in sample.sample_test_results:
            if not test_result.reference_range and test_result.lab_test:
                lab_test_doc = frappe.get_doc("Lab Test", test_result.lab_test)
                if lab_test_doc and lab_test_doc.normal_ranges:
                    # Simple pick for now, ideally match based on gender/age_group
                    test_result.reference_range = f"{lab_test_doc.normal_ranges[0].min_value or ''} - {lab_test_doc.normal_ranges[0].max_value or ''} {lab_test_doc.normal_ranges[0].unit or ''}"
    return samples



@frappe.whitelist()
def create_dummy_sample_with_tests():
    """
    Creates a dummy sample with pre-defined lab tests for demonstration purposes.
    Requires Sample Type, Lab Department, and Lab Tests to exist.
    """
    try:
        # Create Sample Type if it doesn't exist
        if not frappe.db.exists("Sample Type", "Blood"):
            frappe.get_doc({
                "doctype": "Sample Type",
                "sample_type_name": "Blood"
            }).insert(ignore_permissions=True)
            frappe.db.commit()

        # Create Lab Department if it doesn't exist
        if not frappe.db.exists("Lab Department", "Hematology"):
            frappe.get_doc({
                "doctype": "Lab Department",
                "department_name": "Hematology"
            }).insert(ignore_permissions=True)
            frappe.db.commit()

        # Create some Lab Tests if they don't exist
        test_names = ["CBC", "Lipid Profile", "Glucose (Random)"]
        for test_name in test_names:
            if not frappe.db.exists("Lab Test", test_name):
                frappe.get_doc({
                    "doctype": "Lab Test",
                    "test_name": test_name,
                    "department": "Hematology",
                    "normal_ranges": [
                        {
                            "gender": "Both",
                            "min_value": 10,
                            "max_value": 20,
                            "age_group": "Adult",
                            "unit": "g/dL"
                        }
                    ]
                }).insert(ignore_permissions=True)
                frappe.db.commit()

        # Create a new Sample
        sample_doc = frappe.new_doc("Sample")
        sample_doc.sample_name = "Dummy Sample " + frappe.generate_hash(length=4)
        sample_doc.sample_type = "Blood"
        sample_doc.collection_date = frappe.utils.nowdate()
        sample_doc.received_date = frappe.utils.nowdate()
        sample_doc.status = "In-Progress"
        sample_doc.insert(ignore_permissions=True)

        # Add Lab Test Results to the sample
        for test_name in test_names:
            frappe.get_doc({
                "doctype": "Lab Test Result",
                "parenttype": "Sample",
                "parentfield": "sample_test_results",
                "parent": sample_doc.name,
                "lab_test": test_name,
                "status": "Pending",
                "unit": "g/dL", # Assuming unit from dummy test creation
                "reference_range": "10-20 g/dL" # Assuming range from dummy test creation
            }).insert(ignore_permissions=True)

        frappe.db.commit()
        return {"status": "success", "message": "Dummy sample created successfully", "sample_name": sample_doc.name}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "create_dummy_sample_with_tests")
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def update_test_result(test_result_name, result_value):
    """
    Updates the result_value and status of a Lab Test Result.
    """
    try:
        doc = frappe.get_doc("Lab Test Result", test_result_name)
        doc.result_value = result_value
        # Attempt to convert to float if possible for numeric_result_value
        try:
            doc.numeric_result_value = float(result_value)
        except (ValueError, TypeError):
            doc.numeric_result_value = None
        
        doc.status = "Completed" # Mark as completed upon entry
        doc.save(ignore_permissions=True)
        frappe.db.commit()
        return {"status": "success", "message": "Test result updated successfully"}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "update_test_result")
        return {"status": "error", "message": str(e)}


@frappe.whitelist()
def get_sample_stats():
    """
    Returns counts for sample statuses.
    Mappings:
    - Pending Accession -> Received
    - Accessioned -> In-Progress
    - Processing -> Analyzed (or In-Progress if analyzed not used)
    - Rejected -> Rejected
    """
    stats = {
        "pending_accession": frappe.db.count("Sample", {"status": "Received"}),
        "accessioned": frappe.db.count("Sample", {"status": "In-Progress"}),
        "processing": frappe.db.count("Sample", {"status": "Analyzed"}),
        "rejected": frappe.db.count("Sample", {"status": "Rejected"})
    }
    return stats

@frappe.whitelist()
def get_sample_worklist(status=None):
    """
    Returns a list of samples for the worklist.
    """
    filters = {}
    if status == "Pending":
        filters["status"] = "Received"
    elif status and status != "All":
        filters["status"] = status

    samples = frappe.get_list(
        "Sample",
        filters=filters,
        fields=["name", "sample_name", "patient", "collection_date", "status"],
        order_by="creation desc"
    )

    # Enhance sample data with patient details and test info
    for sample in samples:
        # Fetch Patient Details
        if sample.patient:
            patient = frappe.db.get_value("Patient", sample.patient, ["first_name", "last_name"], as_dict=True)
            if patient:
                 sample.patient_name = f"{patient.first_name} {patient.last_name or ''}".strip()
            sample.patient_uhid = sample.patient
        
        # Fetch Test Info
        tests = frappe.get_all("Lab Test Result", filters={"parent": sample.name}, fields=["lab_test"])
        sample.test_info = ", ".join([d.lab_test for d in tests])

        # Format Status for UI
        if sample.status == "Received":
            sample.ui_status = "Pending"
            sample.status_color = "orange"
        elif sample.status == "In-Progress":
            sample.ui_status = "Accessioned"
            sample.status_color = "blue"
        elif sample.status == "Analyzed":
            sample.ui_status = "Processing"
            sample.status_color = "purple"
        elif sample.status == "Rejected":
            sample.ui_status = "Rejected"
            sample.status_color = "red"
        else:
            sample.ui_status = sample.status
            sample.status_color = "gray"

    return samples

@frappe.whitelist()
def get_appointments():
    """
    Returns list of upcoming Collection Appointments with detailed info.
    """
    if frappe.db.exists("DocType", "Collection Appointment"):
        return frappe.get_list(
            "Collection Appointment",
            fields=[
                "name", 
                "patient_name", 
                "patient", 
                "appointment_date", 
                "appointment_time", 
                "status",
                "collection_type"
            ],
            filters={
                "status": ["!=", "Cancelled"]
            },
            limit=20,
            order_by="appointment_date asc, appointment_time asc"
        )
    return []

@frappe.whitelist()
def get_appointment_stats():
    """
    Returns statistics for the Appointment Dashboard based on Collection Appointment.
    """
    if not frappe.db.exists("DocType", "Collection Appointment"):
        return {"scheduled_today": 0, "pending_collection": 0, "completed": 0}

    today = frappe.utils.nowdate()
    
    return {
        "scheduled_today": frappe.db.count("Collection Appointment", {"appointment_date": today, "status": "Scheduled"}),
        "pending_collection": frappe.db.count("Collection Appointment", {"status": "Scheduled", "appointment_date": ["<=", today]}),
        "completed": frappe.db.count("Collection Appointment", {"status": ["in", ["Completed"]]})
    }

@frappe.whitelist()
def create_dummy_collection_appointment():
    """
    Creates a dummy Collection Appointment for testing.
    """
    try:
        if not frappe.db.exists("DocType", "Collection Appointment"):
            return {"status": "error", "message": "Collection Appointment DocType not found"}

        # Get first patient
        patient = frappe.db.get_value("Patient", {}, "name")
        if not patient:
            return {"status": "error", "message": "No patients found. Create a patient first."}
        
        doc = frappe.new_doc("Collection Appointment")
        doc.patient = patient
        doc.collection_type = "Home Collection"
        doc.appointment_date = frappe.utils.nowdate()
        doc.appointment_time = "09:00:00"
        doc.status = "Scheduled"
        doc.address_line1 = "123 Main St, Tech Park"
        doc.city = "Bangalore"
        doc.save(ignore_permissions=True)
        return {"status": "success", "appointment_name": doc.name}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Dummy Collection Appointment Creation Error")
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def get_phlebotomy_queue():
    """
    Returns list of scheduled Collection Appointments for Phlebotomy Queue.
    """
    if frappe.db.exists("DocType", "Collection Appointment"):
        return frappe.get_list(
            "Collection Appointment",
            fields=[
                "name", 
                "patient_name", 
                "patient", 
                "appointment_time", 
                "collection_type"
            ],
            filters={
                "status": "Scheduled"
            },
            limit=20,
            order_by="appointment_date asc, appointment_time asc"
        )
    return []

@frappe.whitelist()
def get_pending_reports():
    """
    Returns list of completed lab tests ready for reporting.
    """
    # Assuming standard Lab Test doc status or custom status 'Completed'
    filters = {"docstatus": 1} if frappe.db.get_value("DocType", "Lab Test", "is_submittable") else {"status": "Completed"}
    
    return frappe.get_list(
        "Lab Test",
        filters=filters,
        fields=["name", "patient_name", "template_name", "creation"], 
        # Using 'template_name' or 'test_name' depending on schema. 'template_name' is standard in Healthcare.
        limit=20,
    )

@frappe.whitelist()
def create_dummy_appointment():
    """
    Creates a dummy patient appointment for testing.
    Handles creation of dependencies: Appointment Type, Company.
    """
    try:
        if not frappe.db.exists("DocType", "Patient Appointment"):
            return {"status": "error", "message": "Patient Appointment DocType not found"}

        # Get first patient
        patient = frappe.db.get_value("Patient", {}, "name")
        if not patient:
            return {"status": "error", "message": "No patients found. Create a patient first."}
        
        # Get or Create Company
        company = frappe.db.get_value("Company", {"is_group": 0}, "name")
        if not company:
            c = frappe.new_doc("Company")
            c.company_name = "MediLIMS Lab"
            c.abbr = "ML"
            c.default_currency = "INR"
            c.country = "India"
            c.save(ignore_permissions=True)
            company = c.name

        # Get or Create Appointment Type
        appt_type = "Checkup"
        if not frappe.db.exists("Appointment Type", appt_type):
            at = frappe.new_doc("Appointment Type")
            at.appointment_type = appt_type
            at.duration = 15
            at.save(ignore_permissions=True)
            
        # Get or Create Practitioner
        hp_firstname = "Dr. Test"
        practitioner = frappe.db.get_value("Healthcare Practitioner", {"first_name": hp_firstname}, "name")
        if not practitioner:
            hp = frappe.new_doc("Healthcare Practitioner")
            hp.first_name = hp_firstname
            hp.status = "Active"
            hp.save(ignore_permissions=True)
            practitioner = hp.name

        date_field = "date" if frappe.db.has_column("Patient Appointment", "date") else "appointment_date"
        
        doc = frappe.new_doc("Patient Appointment")
        doc.title = f"Checkup for {patient}"
        doc.patient = patient
        doc.appointment_type = appt_type
        doc.company = company
        doc.appointment_for = "Practitioner" 
        doc.practitioner = practitioner
        doc.set(date_field, frappe.utils.nowdate())
        # doc.appointment_time = "10:00:00"
        doc.status = "Scheduled"
        doc.save(ignore_permissions=True)
        return {"status": "success", "appointment_name": doc.name}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def get_appointments_for_listing(filters=None, start=0, page_len=20):
    """
    Returns a list of patient appointments for the appointments view.
    Filters and pagination can be applied.
    """
    if filters is None:
        filters = {}

    appointments = frappe.get_list(
        "Patient Appointment",
        filters=filters,
        fields=["name", "patient", "appointment_date", "appointment_time", "status", "practitioner"],
        start=start,
        page_length=page_len,
        order_by="appointment_date desc, appointment_time desc"
    )
    total_count = frappe.db.count("Patient Appointment", filters=filters)
    return {"data": appointments, "total_count": total_count}
