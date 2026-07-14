// ==UserScript==
// @name         Control horario correcto
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  Debajo de las horas normales añado las horas teniendo en cuenta la jornada intensiva
// @author       Juanma
// @match        https://intranet.iti.upv.es/iti-hrm/controlhorario/
// @grant        none
// ==/UserScript==

/* global $ */


/*** Configuración parametrizable ***/
const CONFIG = {
  // Período estival (meses 0-11, donde 0=Enero)
	// 15 de junio
	// 11 de septiembre
  periodoEstival: {
    inicio: { mes: 5, dia: 15 },
    fin: { mes: 8, dia: 11 }
  },
  // Jornada normal (horas/día)
  jornadaNormalHoras: 7.5,
  // Límite diario de descuento del cerdito (minutos)
  limiteDescuentoCerditoMinutos: 30
};


/*** Utils ***/

function getHoraStringFromHtml(horaHtml) {
	return horaHtml.match(/-?\d+:\d+/)[0];
}

function getSegundosFromHoraString(horaString) {
	const h = +horaString.match(/(\d+):/)[1];
	const m = +horaString.match(/:(\d+)/)[1];

	const signo = horaString.indexOf('-') >= 0 ? -1 : 1;

	return (h * 3600 + m * 60) * signo;
}

function getHoraHtmlFromSegundos(segundos, conColor, conSigno, mostrarSegundos) {
	const negativo = segundos < 0;
    let horaString = '';
	if (negativo) segundos *= -1;
	const h = parseInt(segundos / 3600);
	segundos %= 3600;
	let m = parseInt(segundos / 60);
    if (segundos < 60 && mostrarSegundos) {
        if (segundos < 10) segundos = "0" + segundos;
        horaString = (negativo ? '-' : '+') + '0:00:' + parseInt(segundos);
    } else {
		segundos %= 60;
        if (segundos > 30) m++;
        if (m < 10) m = "0" + m;
        horaString = (negativo ? '-' : '+') + h + ':' + m;
    }
    const colorStyle = conColor ? ' style="color: ' + (negativo ? 'red' : 'green') + ';"' : '';
    horaString = conSigno ? horaString : horaString.replace('+', '').replace('-', '');
    return '<span' + colorStyle + '>' + horaString + '</span>';
}

/*** ----------------------------------------------- ***/


/*** Web scraping - recolectando datos ***/

let tarjetasCache = null;

function getTarjetas() {
	if (!tarjetasCache) {
		tarjetasCache = {
			horasMes: $('#widget-wrapper .ibox').first(),
			alFinalDelDia: $('#today_help').closest('.ibox'),
			diasDelMes: $('#month_help').closest('.ibox'),
			disponibleFinDeMes: $('#month_end_help').closest('.ibox'),
			saldoIntensiva: $('.saldo-intensiva').closest('.ibox')
		};
	}
	return tarjetasCache;
}

function getH3sDeTarjeta(tarjeta) {
	return tarjeta.find('.ibox-content h3.no-margins');
}

function getHorasEstipuladasEnSegundos() {
	const horasEstipuladasHtml = getH3sDeTarjeta(getTarjetas().horasMes).eq(1).html();
	const horasEstipuladas = getHoraStringFromHtml(horasEstipuladasHtml);
	return getSegundosFromHoraString(horasEstipuladas);
}

function getHorasEstipuladasAlFinalDelDiaEnSegundos() {
	const horasEstipuladasFinalDelDiaHtml = getH3sDeTarjeta(getTarjetas().alFinalDelDia).eq(0).html();
	const horasEstipuladasFinalDelDia = getHoraStringFromHtml(horasEstipuladasFinalDelDiaHtml);
	return getSegundosFromHoraString(horasEstipuladasFinalDelDia);
}

function getDiferenciaEnSegundos() {
	const horaFinalDiaHtml = getH3sDeTarjeta(getTarjetas().alFinalDelDia).eq(1).html();
	const horaFinalDia = getHoraStringFromHtml(horaFinalDiaHtml);
	return getSegundosFromHoraString(horaFinalDia);
}

function getDiasLaborablesRestantes() {
	return +getH3sDeTarjeta(getTarjetas().disponibleFinDeMes).eq(0).html().trim();
}

function getHorasAlDiaHastaFinDeMesEnSegundos() {
	const horasAlDiaHtml = getH3sDeTarjeta(getTarjetas().disponibleFinDeMes).eq(2).html().trim();
    if (horasAlDiaHtml == '-') return '-';
	const horasAlDia = getHoraStringFromHtml(horasAlDiaHtml);
	return getSegundosFromHoraString(horasAlDia);
}

function getSaldoCerditoEnSegundos() {
	const horasSaldoCerditoHtml = getH3sDeTarjeta(getTarjetas().saldoIntensiva).eq(0).html();
	const horasSaldoCerdito = getHoraStringFromHtml(horasSaldoCerditoHtml);
	return getSegundosFromHoraString(horasSaldoCerdito);
}

function setHorasEstipuladas(htmlHorasEstipuladas) {
	getH3sDeTarjeta(getTarjetas().horasMes).eq(1).html(htmlHorasEstipuladas);
}

function setHoraEstipuladaAlFinalDelDiaCorrecta(htmlHorasEstipuladasAlFinalDelDia) {
	getH3sDeTarjeta(getTarjetas().alFinalDelDia).eq(0).html(htmlHorasEstipuladasAlFinalDelDia);
}

function setHoraDiferenciaCorrecta(htmlDiferenciaReal) {
	getH3sDeTarjeta(getTarjetas().alFinalDelDia).eq(1).html(htmlDiferenciaReal);
}

function setHorasAlDia(htmlHorasAlDia) {
	getH3sDeTarjeta(getTarjetas().disponibleFinDeMes).eq(2).html(htmlHorasAlDia);
}

function setHoraSaldo(htmlHoraSaldo) {
	getH3sDeTarjeta(getTarjetas().saldoIntensiva).eq(0).html(htmlHoraSaldo);
}

function setAclaracion(descuentoSegundosCerditoAlDia, segundosXDia) {
	const descuentoHorasCerditoAlDia = getHoraHtmlFromSegundos(descuentoSegundosCerditoAlDia, false, false, true);
	const horasXDia = getHoraHtmlFromSegundos(segundosXDia, false, false);
	$('#widget-wrapper').after(`
		<div class="row nopadding widgets">
			<div class="col-md-12" style="padding-right: 7px;">
				<div class="ibox float-e-margins">
				<div class="ibox-title">
					<h5>
					Aclaración
					</h5>
				</div>
				<div class="ibox-content">
					<div class="row">
					<div class="col-xs-12">
						<h3 class="no-margins">
							Cada día se descuentan <strong>${descuentoHorasCerditoAlDia}</strong> horas del cerdito, por lo tanto debes trabajar <strong>${horasXDia}</strong> horas al día
						</h3>
						<h3 class="no-margins" style="margin-top: 10px;">
							El segundo valor de "Saldo Intensiva" indica cuánto llevas consumido de más respecto a ese objetivo diario acumulado (o <strong>+0:00</strong> si vas igual o por delante)
						</h3>
					</div>
					</div>
				</div>
				</div>
			</div>
		</div>
	`)
}

/*** ----------------------------------------------- ***/


/*** Lógica ***/

function esEpocaDeJornadaIntensiva() {
	const hoy = new Date();
	const mesActual = hoy.getMonth();
	const diaActual = hoy.getDate();

	const inicio = CONFIG.periodoEstival.inicio;
	const fin = CONFIG.periodoEstival.fin;

	const fechaActual = mesActual * 100 + diaActual;
	const fechaInicio = inicio.mes * 100 + inicio.dia;
	const fechaFin = fin.mes * 100 + fin.dia;

	return fechaActual >= fechaInicio && fechaActual <= fechaFin;
}

function getDiasLaborablesTotalesDelMes() {
	return +getH3sDeTarjeta(getTarjetas().diasDelMes).eq(0).html().trim();
}

function getDiasLaborables(horasEstipuladasEnSegundos) {
	return horasEstipuladasEnSegundos / (CONFIG.jornadaNormalHoras * 3600);
}

function getSegundosARestarParaJornadaIntensiva(diasLaborables, saldoCerditoEnSegundos) {
	let segundosARestarParaJornadaIntensiva = diasLaborables * 0.5 * 3600;
	if (segundosARestarParaJornadaIntensiva > saldoCerditoEnSegundos) {
		segundosARestarParaJornadaIntensiva = saldoCerditoEnSegundos;
	}
	return segundosARestarParaJornadaIntensiva;
}

function getHtmlHorasEstipuladas(horasEstipuladasEnSegundos, segundosEstipiladosEnJornadaIntensiva) {
	return getHoraHtmlFromSegundos(horasEstipuladasEnSegundos, false, false) + '<br>' + getHoraHtmlFromSegundos(segundosEstipiladosEnJornadaIntensiva, false, false);
}

function getHtmlHorasEstipuladasAlFinalDelDia(horasEstipuladasAlFinalDelDiaEnSegundos, diasTrabajados, segundosXDia) {
	return getHoraHtmlFromSegundos(horasEstipuladasAlFinalDelDiaEnSegundos, false, false) + '<br>' + getHoraHtmlFromSegundos(diasTrabajados * segundosXDia, false, false);
}

function getHtmlDiferencia(diferenciaEnSegundos, diferenciaRealEnSegundos) {
	return getHoraHtmlFromSegundos(diferenciaEnSegundos, true, true) + '<br>' + getHoraHtmlFromSegundos(diferenciaRealEnSegundos, true, true);
}

function getHtmlHorasAlDia(segundosXDia, diasLaborablesRestantes, diferenciaRealEnSegundos, diferenciaEnSegundos) {
    const horasAlDiaHastaFinDeMesEnSegundos = getHorasAlDiaHastaFinDeMesEnSegundos();
    if (horasAlDiaHastaFinDeMesEnSegundos == '-') {
        return getHoraHtmlFromSegundos(-diferenciaEnSegundos, false, true) + '<br>' + getHoraHtmlFromSegundos(-diferenciaRealEnSegundos, false, true);
    }
	const segundosAcumulados = diferenciaRealEnSegundos / diasLaborablesRestantes;
	const segundosDia = segundosXDia - segundosAcumulados;
	const htmlHorasAlDia = getHoraHtmlFromSegundos(horasAlDiaHastaFinDeMesEnSegundos, false, true) + '<br>' + getHoraHtmlFromSegundos(segundosDia, false, true)
	return htmlHorasAlDia;
}

function getHtmlHoraSaldo(saldoCerditoEnSegundos, segundosConsumidosCerdito) {
	return getHoraHtmlFromSegundos(saldoCerditoEnSegundos, false, false) + '<br>' + getHoraHtmlFromSegundos(-segundosConsumidosCerdito, true, true);
}

/*** ----------------------------------------------- ***/

function main() {
	if (!esEpocaDeJornadaIntensiva()) return;

	const horasEstipuladasEnSegundos = getHorasEstipuladasEnSegundos();
	const horasEstipuladasAlFinalDelDiaEnSegundos = getHorasEstipuladasAlFinalDelDiaEnSegundos();
	const diferenciaEnSegundos = getDiferenciaEnSegundos();
	const diasLaborablesRestantes = getDiasLaborablesRestantes();
	const saldoCerditoEnSegundos = getSaldoCerditoEnSegundos();

	const diasLaborablesTotales = getDiasLaborablesTotalesDelMes();
	const diasLaborables = getDiasLaborables(horasEstipuladasEnSegundos);
	const segundosARestarParaJornadaIntensiva = getSegundosARestarParaJornadaIntensiva(diasLaborables, saldoCerditoEnSegundos);
	const diasTrabajados = diasLaborablesTotales - diasLaborablesRestantes;
	const segundosEstipiladosEnJornadaIntensiva = horasEstipuladasEnSegundos - segundosARestarParaJornadaIntensiva;
	const descuentoSegundosCerditoAlDia = segundosARestarParaJornadaIntensiva / diasLaborables;
	const segundosXDia = segundosEstipiladosEnJornadaIntensiva / diasLaborables;
	const horasRealizadasHoy = horasEstipuladasAlFinalDelDiaEnSegundos + diferenciaEnSegundos;
	const segundosEstipiladosEnJornadaIntensivaAlFinalDelDia = diasTrabajados * segundosXDia;
	const diferenciaRealEnSegundos = horasRealizadasHoy - segundosEstipiladosEnJornadaIntensivaAlFinalDelDia;
	const segundosConsumidosCerdito = Math.max(0, -diferenciaRealEnSegundos);

	// HTML's modificados
	const htmlHorasEstipuladas = getHtmlHorasEstipuladas(horasEstipuladasEnSegundos, segundosEstipiladosEnJornadaIntensiva);
	const htmlHorasEstipuladasAlFinalDelDia = getHtmlHorasEstipuladasAlFinalDelDia(horasEstipuladasAlFinalDelDiaEnSegundos, diasTrabajados, segundosXDia);
	const htmlDiferenciaReal = getHtmlDiferencia(diferenciaEnSegundos, diferenciaRealEnSegundos);
	const htmlHorasAlDia = getHtmlHorasAlDia(segundosXDia, diasLaborablesRestantes, diferenciaRealEnSegundos, diferenciaEnSegundos);
	const htmlHorasSaldo = getHtmlHoraSaldo(saldoCerditoEnSegundos, segundosConsumidosCerdito);

	setHorasEstipuladas(htmlHorasEstipuladas);
	setHoraEstipuladaAlFinalDelDiaCorrecta(htmlHorasEstipuladasAlFinalDelDia);
	setHoraDiferenciaCorrecta(htmlDiferenciaReal);
	setHorasAlDia(htmlHorasAlDia);
	setHoraSaldo(htmlHorasSaldo);
	setAclaracion(descuentoSegundosCerditoAlDia, segundosXDia);
}

(function () {
	'use strict';
	main();
})();
