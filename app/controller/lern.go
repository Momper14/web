package controller

import (
	"html/template"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/Momper14/web/templates"
	"github.com/Momper14/weblib/client"
	"github.com/Momper14/weblib/client/karteikaesten"
)

// LernController controller for lern
func LernController(w http.ResponseWriter, r *http.Request) {
	defer recoverInternalError()

	type (
		Headline struct {
			Name               string
			Kategorie          string
			SubKat             string
			Fortschritt        int
			A0, A1, A2, A3, A4 int
			Anzahl             int
		}

		Data struct {
			Headline           Headline
			Titel              string
			F0, F1, F2, F3, F4 bool
			Frage, Antwort     template.HTML
		}
	)

	var (
		err      error
		data     Data
		userid   string
		kastenid = mux.Vars(r)["kastenid"]
	)

	if !IstEingeloggt(w, r) {
		forbidden(w)
		return
	}

	userid = GetUser(w, r)

	kasten, err := karteikaesten.New().KastenByID(kastenid)
	if err != nil {
		if _, ok := err.(client.NotFoundError); ok {
			http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
			return
		}
		internalError(err, w)
	}

	index, karte, err := kasten.Zufallskarte(userid)
	if err != nil {
		internalError(err, w)
	}

	data = Data{
		Headline: Headline{
			Name:      kasten.Name,
			Kategorie: kasten.Kategorie,
			SubKat:    kasten.Unterkategorie,
			Anzahl:    kasten.AnzahlKarten(),
		},
		Titel:   karte.Titel,
		Frage:   template.HTML(karte.Frage),
		Antwort: template.HTML(karte.Antwort),
	}

	if data.Headline.Fortschritt, err = kasten.Fortschritt(userid); err != nil {
		internalError(err, w)
	}

	faecher, err := kasten.KartenProFach(userid)
	if err != nil {
		internalError(err, w)
	}

	data.Headline.A0 = faecher[0]
	data.Headline.A1 = faecher[1]
	data.Headline.A2 = faecher[2]
	data.Headline.A3 = faecher[3]
	data.Headline.A4 = faecher[4]

	fach, err := kasten.FachVonKarte(userid, index)
	if err != nil {
		internalError(err, w)
	}

	switch fach {
	case 0:
		data.F0 = true
	case 1:
		data.F1 = true
	case 2:
		data.F2 = true
	case 3:
		data.F3 = true
	case 4:
		data.F4 = true
	}

	customExecuteTemplate(w, r, templates.Lern, data)
}
