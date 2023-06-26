function toIEEE754(v, ebits, fbits) {
	v = math.evaluate(v);

	var bias = (1 << (ebits - 1)) - 1;

	// Compute sign, exponent, fraction
	var s, e, f;
	if (isNaN(v)) {
		e = (1 << bias) - 1;
		f = 1;
		s = 0;
	} else if (v === math.Infinity || v === -math.Infinity) {
		e = (1 << bias) - 1;
		f = 0;
		s = v < 0 ? 1 : 0;
	} else if (v === 0) {
		e = 0;
		f = 0;
		s = 1 / v === -Infinity ? 1 : 0;
	} else {
		s = v < 0;
		v = math.abs(v);

		if (v >= math.pow(2, 1 - bias)) {
			var ln = math.min(math.floor(math.log(v) / math.LN2), bias);
			e = ln + bias;
			f = v * math.pow(2, fbits - ln) - math.pow(2, fbits);
		} else {
			e = 0;
			f = v / math.pow(2, 1 - bias - fbits);
		}
	}

	// Pack sign, exponent, fraction
	var i,
		bits = [];
	for (i = fbits; i; i -= 1) {
		bits.push(f % 2 ? 1 : 0);
		f = Math.floor(f / 2);
	}
	for (i = ebits; i; i -= 1) {
		bits.push(e % 2 ? 1 : 0);
		e = Math.floor(e / 2);
	}
	bits.push(s ? 1 : 0);
	bits.reverse();
	var str = bits.join("");

	// Bits to bytes
	var bytes = [];
	while (str.length) {
		bytes.push(parseInt(str.substring(0, 8), 2));
		str = str.substring(8);
	}
	return bytes;
}

function fromIEEE754(bits, ebits, fbits) {
	if (bits.length != ebits + fbits + 1) {
		console.log("Error: Invalid number of bits.");
		return "Error: Invalid number of bits.";
	}

	bits.replaceAll(" ", "").replaceAll(/[^01]/g, "");

	var isZero = true;
	for (var i = 1; i < bits.length; i++) {
		if (parseInt(bits[i]) == 1) {
			isZero = false;
			break;
		}
	}

	if (isZero) return 0;

	math.config({
		number: "BigNumber",
		precision: 100
	});

	var e = bits.slice(1, ebits + 1);
	e = parseInt(e, 2);
	console.log("e: " + e);

	var f = 0;
	for (var i = ebits + 1; i < ebits + fbits + 1; i++) {
		var bit = parseInt(bits[i]);
		f = math.add(f, math.multiply(bit, math.pow(2, -(i - ebits))));
	}

	console.log("f: " + f);

	var s = bits[0] == 0 ? 1 : -1;

	console.log("s: " + s);

	var k = math.pow(2, ebits - 1) - 1;

	console.log("k: " + k);

	return math.multiply(math.multiply(s, math.add(1, f)), math.pow(2, e - k));
}

function fromIEEE754Double(b) {
	return fromIEEE754(b, 11, 52);
}
function toIEEE754Double(v) {
	return toIEEE754(v, 11, 52);
}
function fromIEEE754Single(b) {
	return fromIEEE754(b, 8, 23);
}
function toIEEE754Single(v) {
	return toIEEE754(v, 8, 23);
}

function toIEEE754DoubleString(v) {
	return toIEEE754Double(v)
		.map(function (n) {
			for (n = n.toString(2); n.length < 8; n = "0" + n);
			return n;
		})
		.join("")
		.replace(/(.)(.{11})(.{52})/, "$1 $2 $3");
}

function getCaretPosition(txt) {
	var startPos = txt.selectionStart;
	caretPos = txt.selectionEnd;
	return caretPos;
}

function setCaretPosition(txt) {
	if (txt.createTextRange) {
		var range = txt.createTextRange();
		range.collapse(true);
		range.moveEnd("character", caretPos);
		range.moveStart("character", caretPos);
		range.select();
		return;
	}

	if (txt.selectionStart) {
		txt.focus();
		txt.setSelectionRange(caretPos, caretPos);
	}
}

var decimalToFpr = document.querySelector("#Decimal-FPR");
var fprToDecimal = document.querySelector("#FPR-Decimal");

var m_decimalToFpr = decimalToFpr.querySelector(".mantissa");
var m_fprToDecimal = fprToDecimal.querySelector(".mantissa");

var e_decimalToFpr = decimalToFpr.querySelector(".exponent");
var e_fprToDecimal = fprToDecimal.querySelector(".exponent");

var i_decimalToFpr = decimalToFpr.querySelector(".input");
var i_fprToDecimal = fprToDecimal.querySelector(".input");

var o_decimalToFpr = decimalToFpr.querySelector(".output");
var o_fprToDecimal = fprToDecimal.querySelector(".output");

var l_decimalToFpr = decimalToFpr.querySelector(".left-button");
var l_fprToDecimal = fprToDecimal.querySelector(".left-button");

var r_decimalToFpr = decimalToFpr.querySelector(".right-button");
var r_fprToDecimal = fprToDecimal.querySelector(".right-button");

var caretPos = 0;

DecimalToFpr();
FprToDecimal();

function DecimalToFpr() {
	if (i_decimalToFpr.value == "") {
		o_decimalToFpr.innerHTML = "";
		return;
	}

	var mantissa = parseInt(m_decimalToFpr.value);
	var exponent = parseInt(e_decimalToFpr.value);

	var value = toIEEE754(i_decimalToFpr.value, e_decimalToFpr.value, m_decimalToFpr.value)
		.map(function (n) {
			for (n = n.toString(2); n.length < 8; n = "0" + n);
			return n;
		})
		.join("");

	o_decimalToFpr.innerHTML = value.slice(0, 1) + " " + value.slice(1, exponent + 1) + " " + value.slice(exponent + 1, exponent + 1 + mantissa);
}

i_decimalToFpr.addEventListener("input", function () {
	DecimalToFpr();
});

function FprToDecimal() {
	var mantissa = parseInt(m_fprToDecimal.value);
	var exponent = parseInt(e_fprToDecimal.value);

	/*getCaretPosition(i_fprToDecimal);*/

	i_fprToDecimal.value = i_fprToDecimal.value.replaceAll(" ", "").replaceAll(/[^01]/g, "");

	if (i_fprToDecimal.value.length == 0) return;
	else if (i_fprToDecimal.value.length < 2) i_fprToDecimal.value = i_fprToDecimal.value;
	else if (i_fprToDecimal.value.length < exponent + 2) {
		i_fprToDecimal.value = i_fprToDecimal.value.slice(0, 1) + " " + i_fprToDecimal.value.slice(1, exponent + 1);
		caretPos += 1;
	} else {
		i_fprToDecimal.value = i_fprToDecimal.value.slice(0, 1) + " " + i_fprToDecimal.value.slice(1, exponent + 1) + " " + i_fprToDecimal.value.slice(exponent + 1, exponent + 1 + mantissa);
		caretPos += 2;
	}
	/*setCaretPosition(i_fprToDecimal);*/

	o_fprToDecimal.value = fromIEEE754(i_fprToDecimal.value.replaceAll(" ", "").replaceAll(/[^01]/g, "").toString(), exponent, mantissa);
}

i_fprToDecimal.addEventListener("input", function (event) {
	FprToDecimal();
});
