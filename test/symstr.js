/* globals describe, before, it */
/* eslint no-unused-expressions:0 */
import {expect} from 'chai';

import {SymString, operators} from '../src/symstr.js';

export default function tests() {

  const str = SymString.single('abc', 23);

  it('get', () => {
    // Returns the character at the specified index.
    const res = str[1];
    expect(res.strs).to.deep.equal([{str: 'b', id: 23, idx: 1, start: 0}]);
    expect(str[-1]).to.be.undefined;
    expect(str[3]).to.be.undefined;
    expect(str.a).to.be.undefined;
  });

  it('set', () => {
    const prev = str.strs;
    expect(str[1] = 'x').to.be.equal('x');
    expect(str.strs).to.deep.equal(prev);
  });

  it('delete', () => {
    const prev = str.strs;
    delete str[1];
    expect(str.strs).to.deep.equal(prev);
  });

  it('defineProperty', () => {
    expect(() => Object.defineProperty(str, 1, {})).to.throw(TypeError);
  });

  it('has', () => {
    expect(() => 1 in str).to.throw(TypeError);
  });

  it('ownKeys', () => {
    expect(() => Object.ownKeys(str)).to.throw(TypeError);
  });

  it('enumerate', () => {
    const res = [];
    /* eslint guard-for-in:0 */
    for (const key in str) {
      res.push(key);
    }
    expect(res).to.deep.equal(['0', '1', '2']);
  });

  it('charAt', () => {
    // Returns the character at the specified index.
    const res = str.charAt(1);
    expect(res.strs).to.deep.equal([{str: 'b', id: 23, idx: 1, start: 0}]);
  });

  it('charCodeAt', () => {
    // Returns a number indicating the Unicode value of the character at the given index.
    const res = str.charCodeAt(1);
    expect(res).to.be.equal(98);
  });

  it('codePointAt', () => {
    // Returns a non-negative integer that is the UTF-16 encoded code point value at the given position.
    const res = str.codePointAt(1);
    expect(res).to.be.equal(98);
  });

  it('concat', () => {
    // Combines the text of two strings and returns a new string.
    expect(str.concat().toSourceString()).to.be.equal('abc');
    expect(str.concat('d').toSourceString()).to.be.equal('abcd');
    expect(str.concat('de').toSourceString()).to.be.equal('abcde');
  });

  it('includes', () => {
    // Determines whether one string may be found within another string.
    expect(str.includes('d')).to.be.false;
    expect(str.includes('c')).to.be.true;
  });

  it('endsWith', () => {
    // Determines whether a string ends with the characters of another string.
    expect(str.endsWith('d')).to.be.false;
    expect(str.endsWith('bc')).to.be.true;
  });

  it('indexOf', () => {
    // Returns the index within the calling String object of the first occurrence of the specified value, or -1 if not found.
    expect(str.indexOf('d')).to.be.equal(-1);
    expect(str.indexOf('bc')).to.be.equal(1);
  });

  it('lastIndexOf', () => {
    // Returns the index within the calling String object of the last occurrence of the specified value, or -1 if not found.
    expect(str.lastIndexOf('d')).to.be.equal(-1);
    expect(str.lastIndexOf('bc')).to.be.equal(1);
  });

  it('localeCompare', () => {
    // Returns a number indicating whether a reference string comes before or after or is the same as the given string in sort order.
    expect(str.localeCompare('aa')).to.be.equal(1);
    expect(str.localeCompare('c')).to.be.equal(-1);
  });

  it('match', () => {
    // Used to match a regular expression against a string.
    expect(str.match(/bb/)).to.be.null;
    expect(str.match(/ab/)[0]).to.be.equal('ab');
  });

  it('normalize', () => {
    // Returns the Unicode Normalization Form of the calling string value.
    expect(str.normalize().strs).to.deep.equal([{str: 'abc', id: 23, idx: 0, start: 0}]);
  });

  it('quote', () => {
    // Wraps the string in double quotes (""").
    expect(str.quote().toSourceString()).to.be.equal('"abc"');
  });

  it('repeat', () => {
    // Returns a string consisting of the elements of the object repeated the given times.
    expect(str.repeat(0)).to.be.equal('');
    expect(str.repeat(1).toSourceString()).to.be.equal('abc');
    expect(str.repeat(2).toSourceString()).to.be.equal('abcabc');
  });

  it('replace', () => {
    // Used to find a match between a regular expression and a string, and to replace the matched substring with a new substring.
    expect(str.replace('d', 'x').toSourceString()).to.be.equal('abc');
    expect(str.replace('b', 'x').toSourceString()).to.be.equal('axc');
    expect(str.replace(/[ac]/g, 'x').toSourceString()).to.be.equal('xbx');
  });

  it('search', () => {
    // Executes the search for a match between a regular expression and a specified string.
    expect(str.search('b')).to.be.equal(1);
  });

  it('slice', () => {
    // Extracts a section of a string and returns a new string.
    expect(str.slice(1, 2).toSourceString()).to.be.equal('b');
    expect(str.slice(1, 2).strs).to.deep.equal([{str: 'b', id: 23, idx: 1, start: 0}]);
    expect(str.slice(1, 3).strs).to.deep.equal([{str: 'bc', id: 23, idx: 1, start: 0}]);
    expect(str.slice(0, 2).strs).to.deep.equal([{str: 'ab', id: 23, idx: 0, start: 0}]);
  });

  it('split', () => {
    // Splits a String object into an array of strings by separating the string into substrings.
    const res = str.split('b');
    expect(res[0].toSourceString()).to.be.equal('a');
    expect(res[1].toSourceString()).to.be.equal('c');
  });

  it('startsWith', () => {
    // Determines whether a string begins with the characters of another string.
    expect(str.startsWith('b')).to.be.false;
    expect(str.startsWith('ab')).to.be.true;
  });

  it('substr', () => {
    // Returns the characters in a string beginning at the specified location through the specified number of characters.
    expect(str.substr(1, 2).toSourceString()).to.be.equal('bc');
  });

  it('substring', () => {
    // Returns the characters in a string between two indexes into the string.
    debugger;
    expect(str.substring(1, 2).toSourceString()).to.be.equal('b');
  });

  it('toLocaleLowerCase', () => {
    // The characters within a string are converted to lower case while respecting the current locale. For most languages, this will return the same as toLowerCase().
    expect(str.toLocaleLowerCase().toSourceString()).to.be.equal('abc');
  });

  it('toLocaleUpperCase', () => {
    // The characters within a string are converted to upper case while respecting the current locale. For most languages, this will return the same as toUpperCase().
    expect(str.toLocaleUpperCase().toSourceString()).to.be.equal('ABC');
  });

  it('toLowerCase', () => {
    // Returns the calling string value converted to lower case.
    expect(str.toLowerCase().toSourceString()).to.be.equal('abc');
  });

  it('toString', () => {
    // Returns a string representing the specified object. Overrides the Object.prototype.toString() method.
    expect(str.toString().strs).to.deep.equal(str.strs);
  });

  it('toUpperCase', () => {
    // Returns the calling string value converted to uppercase.
    expect(str.toUpperCase().toSourceString()).to.be.equal('ABC');
  });

  it('trim', () => {
    // Trims whitespace from the beginning and end of the string. Part of the ECMAScript 5 standard.
    const res = SymString.single(' abc ').trim();
    expect(res.toSourceString()).to.be.equal('abc');
  });

  it('trimLeft', () => {
    // Trims whitespace from the left side of the string.
    const res = SymString.single(' abc ').trimLeft();
    expect(res.toSourceString()).to.be.equal('abc ');
  });

  it('trimRight', () => {
    // Trims whitespace from the right side of the string.
    const res = SymString.single(' abc ').trimRight();
    expect(res.toSourceString()).to.be.equal(' abc');
  });

  it('valueOf', () => {
    // Returns the primitive value of the specified object. Overrides the Object.prototype.valueOf() method.
    expect(str.toString().strs).to.deep.equal(str.strs);
  });

  it('anchor', () => {
    // <a name="name"> (hypertext target)
    const res = str.anchor('name').toSourceString();
    expect(res).to.be.equal('<a name="name">abc</a>');
  });

  it('big', () => {
    // <big>
    const res = str.big().toSourceString();
    expect(res).to.be.equal('<big>abc</big>');
  });

  it('blink', () => {
    // <blink>
    const res = str.blink().toSourceString();
    expect(res).to.be.equal('<blink>abc</blink>');
  });

  it('bold', () => {
    // <b>
    const res = str.bold().toSourceString();
    expect(res).to.be.equal('<b>abc</b>');
  });

  it('fixed', () => {
    // <tt>
    const res = str.fixed().toSourceString();
    expect(res).to.be.equal('<tt>abc</tt>');
  });

  it('fontcolor', () => {
    // <font color="color">
    const res = str.fontcolor('#fff').toSourceString();
    expect(res).to.be.equal('<font color="#fff">abc</font>');
  });

  it('fontsize', () => {
    // <font size="size">
    const res = str.fontsize(20).toSourceString();
    expect(res).to.be.equal('<font size="20">abc</font>');
  });

  it('italics', () => {
    // <i>
    const res = str.italics().toSourceString();
    expect(res).to.be.equal('<i>abc</i>');
  });

  it('link', () => {
    // <a href="rul"> (link to URL)
    const res = str.link('http://tom').toSourceString();
    expect(res).to.be.equal('<a href="http://tom">abc</a>');
  });

  it('small', () => {
    // <small>
    const res = str.small().toSourceString();
    expect(res).to.be.equal('<small>abc</small>');
  });

  it('strike', () => {
    // <strike>
    const res = str.strike().toSourceString();
    expect(res).to.be.equal('<strike>abc</strike>');
  });

  it('sub', () => {
    // <sub>
    const res = str.sub().toSourceString();
    expect(res).to.be.equal('<sub>abc</sub>');
  });

  it('sup', () => {
    // <sup>
    const res = str.sup().toSourceString();
    expect(res).to.be.equal('<sup>abc</sup>');
  });

  const {unary, binary} = operators;

  it('instanceof', () => {
    expect(binary.instanceof(str, String)).to.be.true;
  });

  it('typeof', () => {
    expect(unary.typeof(str)).to.be.equal('string');
  });

}
