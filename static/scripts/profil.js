var neuesBild = false;

$(document).ready(function () {
    $('#profil-button-delete').click(function () {
        $('#modal').toggleClass("is-active", true);
    });
    $('#profil-modal-button-keep').click(function () {
        $('#modal').toggleClass("is-active", false);
    });
    $('#profil-input-email').blur(validateEmail);
    $('#profil-input-passwort').blur(validatePassword);
    $('#profil-input-neu').blur(function () { validatePasswordNeu(); });
    $('#profil-input-wiederholen').blur(function () { validatePasswordNeu(); });
    $('#edit-button-save').click(updateProfil);
    $('#profil-modal-button-delete').click(deleteProfile);
    $("#input-image").change(function (evnt) {
        readImage(function (image) {
            $('#profile-profile-image').attr('src', image);
            neuesBild = true;
        });
    });
})


function validateEmail() {
    let val = $("#profil-input-email").val();

    if (val == "" || !validateEmailString(val)) {
        $("#profil-input-email-icon-right").toggleClass("is-hidden", true);
        return
    }

    $.ajax({
        type: "POST",
        url: "/profil/email/" + val,
        success: function () {
            $("#edit-mail-help").toggleClass("is-invisible", true);
            $("#profil-input-email-icon-right").toggleClass("is-hidden", false);
        },
        error: function (xhr, _, msg) {
            if (xhr.status == 409) {
                $("#edit-mail-help").toggleClass("is-invisible", false);
                $("#profil-input-email-icon-right").toggleClass("is-hidden", true);
            } else {
                alert(msg);
            }
        }
    });
}

function validatePassword() {
    pw1 = $('#profil-input-passwort').val()

    if (pw1 == "") {
        $("#edit-oldpw-help").toggleClass("is-invisible", true);
        $("#profil-input-passwort-icon-right").toggleClass("is-hidden", true);
    } else {
        $.ajax({
            type: "POST",
            url: "/profil/passwort/" + sha512(pw1),
            success: function () {
                $("#edit-oldpw-help").toggleClass("is-invisible", false);
                $("#profil-input-passwort-icon-right").toggleClass("is-hidden", true);
            },
            error: function (xhr, _, msg) {
                if (xhr.status == 409) {
                    $("#edit-oldpw-help").toggleClass("is-invisible", true);
                    $("#profil-input-passwort-icon-right").toggleClass("is-hidden", false);
                } else {
                    alert(msg);
                }
            }
        });
    }
}

function validatePasswordNeu() {
    pw1 = $('#profil-input-neu').val()
    pw2 = $('#profil-input-wiederholen').val()

    if (pw1 == "") {
        $("#edit-newpw-help").toggleClass("is-invisible", true);
        $("#profil-input-neu-icon-right").toggleClass("is-hidden", true);
        return true
    } else {
        $.ajax({
            type: "POST",
            url: "/profil/passwort/" + sha512(pw1),
            success: function () {
                $("#edit-newpw-help").toggleClass("is-invisible", true);
                $("#profil-input-neu-icon-right").toggleClass("is-hidden", false);
            },
            error: function (xhr, _, msg) {
                if (xhr.status == 409) {
                    $("#edit-newpw-help").toggleClass("is-invisible", false);
                    $("#profil-input-neu-icon-right").toggleClass("is-hidden", true);
                } else {
                    alert(msg);
                }
            }
        });
    }

    if (pw2 == "") {
        $("#profil-input-wiederholen-icon-right").toggleClass("is-hidden", true);
        if (pw1 == "") {
            $("#edit-reppw-help").toggleClass("is-invisible", true);
        }
        return false;
    }

    if (pw1 === pw2) {
        $("#profil-input-wiederholen-icon-right").toggleClass("is-hidden", false);
        $("#edit-reppw-help").toggleClass("is-invisible", true);
        return true;
    } else {
        $("#profil-input-wiederholen-icon-right").toggleClass("is-hidden", true);
        $("#edit-reppw-help").toggleClass("is-invisible", false);
        return false;
    }
}

function updateProfil() {
    validateEmail();
    validatePassword();
    if (!validatePasswordNeu()) {
        return false;
    }

    var data = {}

    email = $('#profil-input-email').val()
    pwn = $('#profil-input-neu').val()
    if (email == "" && pwn == "" && !neuesBild) {
        alert("Es gibt keine Änderungen!");
        return false;
    }

    if (email != "" && !validateEmailString(email)) {
        alert("EMail ist ungültig!");
        return false;
    } else {
        data["EMail"] = email;
    }

    if (pwn != "") {
        pwo = $('#profil-input-passwort').val()

        if (pwo == "") {
            alert("Altes Passwort ungültig!");
            return false;
        }

        data["Passwort"] = sha512(pwo);
        data["Neu"] = sha512(pwn);
    }

    var ajax = function (data) {
        $.ajax({
            type: "PUT",
            url: "/profil",
            data: JSON.stringify(data),
            success: function () {
                window.location.href = "/profil";
            },
            error: function (xhr, _, msg) {
                if (xhr.status == 401) {
                    alert("Altes Passwort falsch!");
                } else if (xhr.status == 409) {
                    alert("Fehlerhafte Eingaben!");
                } else {
                    defaultErrorHandling(xhr, _, msg);
                }
            },
            contentType: "application/json"
        });
    }

    if (neuesBild) {
        readImage(function (image) {
            data["Bild"] = image;
            ajax(data)
        })
    } else {
        ajax(data)
    }
}

function deleteProfile() {
    $.ajax({
        type: "DELETE",
        url: "/profil",
        success: function () {
            window.location.href = "/";
        },
        error: function (xhr, _, msg) {
            defaultErrorHandling(xhr, _, msg);
            window.location.href = "/profil";
        },
        contentType: "application/json"
    });
}

function readImage(callback) {
    let file = $("#input-image").prop('files')[0];

    if (!file){
        return;
    }

    let reader = new FileReader();

    type = file.type;
    type = type.substring(0, type.indexOf('/'));
    if (type !== "image") {
        alert("Keine gültige Bilddatei!");
        return
    }

    reader.onload = function (data) {
        callback(data.target.result);
    }

    reader.readAsDataURL(file);
}