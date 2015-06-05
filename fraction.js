/**
 * @license Fraction.js v2.2.0 01/06/2015
 * http://www.xarg.org/2014/03/precise-calculations-in-javascript/
 *
 * Copyright (c) 2015, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/


/**
 *
 * This class offers the possebility to calculate fractions.
 * You can pass a fraction in different formats. Either as array, as double, as string or as an integer.
 *
 * Array/Object form
 * [ 0 => <nominator>, 1 => <denominator> ]
 * [ n => <nominator>, d => <denominator> ]
 *
 * Integer form
 * - Single integer value
 *
 * Double form
 * - Single double value
 *
 * String form
 * 123.456 - a simple double
 * 123/456 - A string fraction
 * 123.'456' - a double with repeating decimal places
 * 123.(456) - synonym
 * 123.45'6' - a double with repeating last place
 * 123.45(6) - synonym
 *
 * Example:
 *
 * var f = new Fraction("9.4'31'");
 * f.mul([-4, 3]).div(4.9);
 *
 */

"use strict";

(function(root) {

    // Parsed data to avoid calling "new" all the time
    var P = {
        'n': 0,
        'd': 0,
        's': 0
    };

    function assign(n, s) {

        if (isNaN(n = parseInt(n, 10))) {
            parser_exit();
        }
        return n * s;
    }

    function parser_exit() {
        throw "Invalid Param";
    }

    var parse = function(p1, p2) {

        var n = 0, d = 1, s = 1;

        var v = 0, w = 0, x = 0, y = 1, z = 1;

        var A = 0, B = 1;
        var C = 1, D = 1;

        var N = 10000000;
        var M;

        if (p1 === undefined || p1 === null) {
            /* void */
        } else if (p2 !== undefined) {
            n = p1;
            d = p2;
            s = n * d;
        } else
            switch (typeof p1) {

                case "object":
                {
                    if ('d' in p1 && 'n' in p1) {
                        n = p1['n'];
                        d = p1['d'];
                        if ('s' in p1)
                            n*= p1['s'];
                    } else if (0 in p1) {
                        n = p1[0];
                        if (1 in p1)
                            d = p1[1];
                    } else {
                        parser_exit();
                    }
                    s = n * d;
                    break;
                }
                case "number":
                {
                    if (p1 < 0) {
                        s = p1;
                        p1 = -p1;
                    }

                    if (p1 % 1 === 0) {
                        n = p1;
                    } else if (p1 > 0) { // check for != 0, scale would become NaN (log(0)), which converges really slow

                        if (p1 >= 1) {
                            z = Math.pow(10, Math.floor(1 + Math.log(p1) / Math.LN10));
                            p1/= z;
                        }

                        // Using Farey Sequences
                        // http://www.johndcook.com/blog/2010/10/20/best-rational-approximation/

                        while (B <= N && D <= N) {
                            M = (A + C) / (B + D);

                            if (p1 === M) {
                                if (B + D <= N) {
                                    n = A + C;
                                    d = B + D;
                                } else if (D > B) {
                                    n = C;
                                    d = D;
                                } else {
                                    n = A;
                                    d = B;
                                }
                                break;

                            } else {

                                if (p1 > M) {
                                    A+= C;
                                    B+= D;
                                } else {
                                    C+= A;
                                    D+= B;
                                }

                                if (B > N) {
                                    n = C;
                                    d = D;
                                } else {
                                    n = A;
                                    d = B;
                                }
                            }
                        }
                        n*= z;
                    }
                    break;
                }
                case "string":
                {
                    B = p1.match(/\d+|./g);

                    if (B[A] === '-') {// Check for minus sign at the beginning
                        s = -1;
                        A++;
                    } else if (B[A] === '+') {// Check for plus sign at the beginning
                        A++;
                    }

                    if (B.length === A + 1) { // Check if it's just a simple number "1234"
                        w = assign(B[A++], s);
                    } else if (B[A + 1] === '.' || B[A] === '.') { // Check if it's a decimal number

                        if (B[A] !== '.') { // Handle 0.5 and .5
                            v = assign(B[A++], s);
                        }
                        A++;

                        // Check for decimal places
                        if (A + 1 === B.length || B[A + 1] === '(' && B[A + 3] === ')' || B[A + 1] === "'" && B[A + 3] === "'") {
                            w = assign(B[A], s);
                            y = Math.pow(10, B[A].length);
                            A++;
                        }

                        // Check for repeating places
                        if (B[A] === '(' && B[A + 2] === ')' || B[A] === "'" && B[A + 2] === "'") {
                            x = assign(B[A + 1], s);
                            z = Math.pow(10, B[A + 1].length) - 1;
                            A+= 3;
                        }

                    } else if (B[A + 1] === '/' || B[A + 1] === ':') { // Check for a simple fraction "123/456" or "123:456"
                        w = assign(B[A], s);
                        y = assign(B[A + 2], 1);
                        A+= 3;
                    } else if (B[A + 3] === '/' && B[A + 1] === ' ') { // Check for a complex fraction "123 1/2"
                        v = assign(B[A], s);
                        w = assign(B[A + 2], s);
                        y = assign(B[A + 4], 1);
                        A+= 5;
                    }

                    if (B.length <= A) { // Check for more tokens on the stack
                        s = /* void */
                        n = x + z * (v * y + w);
                        d = y * z;
                        break;
                    }

                    /* Fall through on error */
                }
                default:
                    parser_exit();
            }

        if (!d) {
            throw "DIV/0";
        }

        P['s'] = (0 <= s) - (s < 0);
        P['n'] = Math.abs(n);
        P['d'] = Math.abs(d);
    };

    var modpow = function(b, e, m) {

        for (var r = 1; e > 0; b = (b * b) % m, e >>= 1) {

            if (e & 1) {
                r = (r * b) % m;
            }
        }
        return r;
    };

    var cycleLen = function(n, d) {

        if (d % 2 === 0) {
            return cycleLen(n, d / 2);
        }

        if (d % 5 === 0) {
            return cycleLen(n, d / 5);
        }

        for (var t = 1; t < 2000; t++) { // If you expect numbers longer then 2k chars repeating, increase the 2000
            // Solve 10^t == 1 (mod d) for d != 0 (mod 2, 5)
            // http://mathworld.wolfram.com/FullReptendPrime.html
            if (1 === modpow(10, t, d)) {
                return t;
            }
        }
        return 0;
    };

    var cycleStart = function(n, d, len) {

        for (var s = 0; s < 300; s++) { // s < ~log10(Number.MAX_VALUE)
            // Solve 10^s == 10^(s+t) (mod d)
            if (modpow(10, s, d) === modpow(10, s + len, d))
                return s;
        }
        return 0;
    };

    var gcd = function(a, b) {
        var t;
        while (b) {
            t = a;
            a = b;
            b = t % b;
        }
        return a;
    };

    /**
     * Module constructor
     *
     * @constructor
     * @param {number|Fraction} a
     * @param {number=} b
     */
    function Fraction(a, b) {

        parse(a, b);

        a = gcd(P['d'], P['n']); // Abuse a

        this['s'] = P['s'];
        this['n'] = P['n'] / a;
        this['d'] = P['d'] / a;
    }

    Fraction.prototype['s'] = 1;
    Fraction.prototype['n'] = 0;
    Fraction.prototype['d'] = 1;

    /**
     * Calculates the absolute value
     *
     * Ex: new Fraction(-4).abs() => 4
     **/
    Fraction.prototype['abs'] = function() {

        return new Fraction(this['n'], this['d']);
    };

    /**
     * Inverts the sign of the current fraction
     *
     * Ex: new Fraction(-4).neg() => 4
     **/
    Fraction.prototype['neg'] = function() {

        return new Fraction(-this['s'] * this['n'], this['d']);
    };

    /**
     * Adds two rational numbers
     *
     * Ex: new Fraction({n: 2, d: 3}).add("14.9") => 467 / 30
     **/
    Fraction.prototype['add'] = function(a, b) {

        parse(a, b);

        return new Fraction(
                this['s'] * this['n'] * P['d'] + P['s'] * this['d'] * P['n'],
                this['d'] * P['d']
                );
    };

    /**
     * Subtracts two rational numbers
     *
     * Ex: new Fraction({n: 2, d: 3}).add("14.9") => -427 / 30
     **/
    Fraction.prototype['sub'] = function(a, b) {

        parse(a, b);

        return new Fraction(
                this['s'] * this['n'] * P['d'] - P['s'] * this['d'] * P['n'],
                this['d'] * P['d']
                );
    };

    /**
     * Multiplies two rational numbers
     *
     * Ex: new Fraction("-17.(345)").mul(3) => 5776 / 111
     **/
    Fraction.prototype['mul'] = function(a, b) {

        parse(a, b);

        return new Fraction(
                this['s'] * P['s'] * this['n'] * P['n'],
                this['d'] * P['d']
                );
    };

    /**
     * Divides two rational numbers
     *
     * Ex: new Fraction("-17.(345)").reciprocal().div(3)
     **/
    Fraction.prototype['div'] = function(a, b) {

        parse(a, b);

        return new Fraction(
                this['s'] * P['s'] * this['n'] * P['d'],
                this['d'] * P['n']
                );
    };

    /**
     * Clones the actual object
     *
     * Ex: new Fraction("-17.(345)").clone()
     **/
    Fraction.prototype['clone'] = function() {
        return new Fraction(this);
    };

    /**
     * Calculates the modulo of two rational numbers - a more precise fmod
     *
     * Ex: new Fraction('4.(3)').mod([7, 8]) => (13/3) % (7/8) = (5/6)
     **/
    Fraction.prototype['mod'] = function(a, b) {

        if (a === undefined) {
            return new Fraction(this['s'] * this['n'] % this['d'], 1);
        }

        parse(a, b);

        if (0 === (P['n'] * this['d'])) {
            Fraction(0, 0); // Throw div/0
        }

        /*
         * First silly attempt, kinda slow
         *
         return that['sub']({
         'n': num['n'] * Math.floor((this.n / this.d) / (num.n / num.d)),
         'd': num['d'],
         's': this['s']
         });*/

        /*
         * New attempt: a1 / b1 = a2 / b2 * q + r
         * => b2 * a1 = a2 * b1 * q + b1 * b2 * r
         * => (b2 * a1 % a2 * b1) / (b1 * b2)
         */
        return new Fraction(
                (this['s'] * P['d'] * this['n']) % (P['n'] * this['d']),
                P['d'] * this['d']
                );
    };

    /**
     * Calculates the fractional gcd of two rational numbers
     *
     * Ex: new Fraction(5,8).gcd(3,7) => 1/56
     */
    Fraction.prototype['gcd'] = function(a, b) {

        parse(a, b);

        return new Fraction(gcd(P['n'], this['n']), P['d'] * this['d'] / gcd(P['d'], this['d']));
    };


    /**
     * Calculates the ceil of a rational number
     *
     * Ex: new Fraction('4.(3)').ceil() => (5 / 1)
     **/
    Fraction.prototype['ceil'] = function() {

        return new Fraction(Math.ceil(this['s'] * this['n'] / this['d']), 1);
    };

    /**
     * Calculates the floor of a rational number
     *
     * Ex: new Fraction('4.(3)').floor() => (4 / 1)
     **/
    Fraction.prototype['floor'] = function() {

        return new Fraction(Math.floor(this['s'] * this['n'] / this['d']), 1);
    };

    /**
     * Rounds a rational numbers
     *
     * Ex: new Fraction('4.(3)').round() => (4 / 1)
     **/
    Fraction.prototype['round'] = function() {

        return new Fraction(Math.round(this['s'] * this['n'] / this['d']), 1);
    };


    /**
     * Gets the reciprocal form of the fraction, means numerator and denumerator are exchanged
     *
     * Ex: new Fraction([-3, 4]).reciprocal() => -4 / 3
     **/
    Fraction.prototype['reciprocal'] = function() {

        return new Fraction(this['s'] * this['d'], this['n']);
    };

    /**
     * Calculates the fraction to some integer exponent
     *
     * Ex: new Fraction(-1,2).pow(-3) => -8
     */
    Fraction.prototype['pow'] = function(m) {

        var d = this['d'];
        var n = this['n'];

        if (m < 0) {
            this['d'] = Math.pow(n, -m);
            this['n'] = Math.pow(d, -m);
        } else {
            this['d'] = Math.pow(d, m);
            this['n'] = Math.pow(n, m);
        }

        if (0 === (m % 2)) {
            this['s'] = 1;
        }
        return this;
    };

    /**
     * Check if two rational numbers are the same
     *
     * Ex: new Fraction(19.6).equals([98, 5]);
     **/
    Fraction.prototype['equals'] = function(a, b) {

        parse(a, b);

        return this['s'] * this['n'] * P['d'] === P['s'] * P['n'] * this['d']; // Same as compare() === 0
    };

    /**
     * Check if two rational numbers are the same
     *
     * Ex: new Fraction(19.6).equals([98, 5]);
     **/
    Fraction.prototype['compare'] = function(a, b) {

        parse(a, b);

        var t = (this['s'] * this['n'] * P['d'] - P['s'] * P['n'] * this['d']);

        return (0 < t) - (t < 0);
    };

    /**
     * Check if two rational numbers are divisible
     *
     * Ex: new Fraction(19.6).divisible(1.5);
     */
    Fraction.prototype['divisible'] = function(a, b) {

        parse(a, b);

        return !!(P['n'] * this['d']) && !((this['n'] * P['d']) % (P['n'] * this['d']));
    };

    /**
     * Returns a decimal representation of the fraction
     *
     * Ex: new Fraction("100.'91823'").valueOf() => 100.91823918239183
     **/
    Fraction.prototype['valueOf'] = function() {

        return this['s'] * this['n'] / this['d'];
    };

    /**
     * Returns a string-fraction representation of a Fraction object
     *
     * Ex: new Fraction("1.'3'").toFraction() => "4 1/3"
     **/
    Fraction.prototype['toFraction'] = function() {

        var whole, str = "";

        var n = this['n'];
        var d = this['d'];

        if (this['s'] < 0) {
            str+= '-';
        }

        if (d === 1) {
            str+= n;
        } else {
            whole = Math.floor(n / d);

            if (whole > 0) {
                str+= whole;
                str+= " ";
                n = n % d;
            }

            str+= n;
            str+= '/';
            str+= d;
        }
        return str;
    };

    /**
     * Returns a latex representation of a Fraction object
     *
     * Ex: new Fraction("1.'3'").toLatex() => "\frac{4}{3}"
     **/
    Fraction.prototype['toLatex'] = function() {

        var whole, str = "";

        var n = this['n'];
        var d = this['d'];

        if (this['s'] < 0) {
            str+= '-';
        }

        if (d === 1) {
            str+= n;
        } else {
            whole = Math.floor(n / d);

            if (whole > 0) {
                str+= whole;
                n = n % d;
            }

            str+= '\frac{';
            str+= n;
            str+= '}{';
            str+= d;
            str+= '}';
        }
        return str;
    };

    /**
     * Creates a string representation of a fraction with all digits
     *
     * Ex: new Fraction("100.'91823'").toString() => "100.(91823)"
     **/
    Fraction.prototype['toString'] = function() {

        var p = String(this['n']).split(""); // Numerator chars
        var q = this['d']; // Denominator
        var t = 0; // Tmp var

        var ret = [~this['s'] ? "" : "-", "", ""]; // Return array, [0] is zero sign, [1] before comma, [2] after
        var zeros = ""; // Collection variable for zeros

        var cycLen = cycleLen(this['n'], this['d']); // Cycle length
        var cycOff = cycleStart(this['n'], this['d'], cycLen); // Cycle start

        var j = -1;
        var n = 1; // str index

        // rough estimate to fill zeros
        var length = 10 + cycLen + cycOff + p.length;  // 10 = decimal places when no repitation

        for (var i = 0; i < length; i++, t*= 10) {

            if (i < p.length) {
                t+= Number(p[i]);
            } else {
                n = 2;
                j++; // Start now => after comma
            }

            if (cycLen > 0) { // If we have a repeating part
                if (j === cycOff) {
                    ret[n]+= zeros + "(";
                    zeros = "";
                } else if (j === cycLen + cycOff) {
                    ret[n]+= zeros + ")";
                    break;
                }
            }

            if (t >= q) {
                ret[n]+= zeros + ((t / q) | 0); // Flush zeros, Add current digit
                zeros = "";
                t = t % q;
            } else if (n > 1) { // Add zeros to the zero buffer
                zeros+= "0";
            } else if (ret[n]) { // If before comma, add zero only if already something was added
                ret[n]+= "0";
            }
        }

        // If it's empty, it's a leading zero only
        ret[0]+= ret[1] || "0";

        // If there is something after the comma, add the comma sign
        if (ret[2]) {
            return ret[0] + "." + ret[2];
        }
        return ret[0];
    };

    if (typeof define === 'function' && define['amd']) {
        define([], function() {
            return Fraction;
        });
    } else if (typeof exports === 'object') {
        module['exports'] = Fraction;
    } else {
        root['Fraction'] = Fraction;
    }

})(this);
