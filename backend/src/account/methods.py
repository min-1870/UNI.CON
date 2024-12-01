from .models import School

def get_school_from_email(email):
    schools = School.objects.values_list("id", "name", "initial")
    for id, name, initial in schools:
        if initial in email[email.index("@"):]:
            return {"id":id, "name":name, "initial":initial}
    return False