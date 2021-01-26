#!/usr/bin/env node

var file = process.argv[2];
var keyword = process.argv[3];
//console.log("file: %s", file);
//console.log("keyword: %s", keyword);

const fs = require('fs');
const { endianness } = require('os');
const readline = require('readline');

function Absolute(m) {
  var ret = 0;
  for (var i = 0; i < m.length; i++) {
    ret += m[i] * m[i];
  }
  return(Math.sqrt(ret));
}

function DotProduct(m1, m2) {
  var ret = 0;
  for (var i = 0; i < m1.length; i++) {
    ret += m1[i] * m2[i];
  }
  return(ret);
}

function CosineSimilarity(dot, nrm1, nrm2) {
  return(dot/(nrm1*nrm2));
}

var n1 = 0;
var a = {};

const reader1 = async function(rs1) {
  for await (const chunk of rs1) {
    var elm = chunk.split(' ');
    if (elm[0] == keyword) {
      a = {};
      a.key = elm[0];
      a.mtx = [];
      for (var i = 1; i < elm.length; i++) {
        a.mtx.push(parseFloat(elm[i]));
      }
      a.nrm = Absolute(a.mtx);
      break;
    }
    n1++;
  }
};

var n2 = 0;
var distance = [];
const reader2 = async function(rs2) {
  for await (const chunk of rs2) {
    var elm = chunk.split(' ');
    if (elm.length > 2 && elm[0] != keyword) {
      var b = {};
      b.key = elm[0];
      b.mtx = [];
      for (var i = 1; i < elm.length; i++) {
        b.mtx.push(parseFloat(elm[i]));
      }
      b.nrm = Absolute(b.mtx);
      dot = DotProduct(a.mtx, b.mtx);
      sim = CosineSimilarity(dot, a.nrm, b.nrm);
      distance.push({ 'key': b.key, 'sim': sim });
      //console.log("%d:  %s  %d", n2, b.key, sim);
    }
    process.stderr.write(n2+" times\r");
    n2++;
  }
};

const N = 40;	// number of closest words that will be shown

function Compare(a, b) {
  return(b.sim - a.sim);
}

async function main() {
  // ファイルの存在をチェック "Input file not found\n"
  const rs1 = fs.createReadStream(file, { encoding: 'utf8' });
  const rl1 = readline.createInterface(rs1, {});
  await reader1(rl1);
  if (!a.key) {
    console.log("Out of dictionary word!");
    return;
  }
  console.log("\nWord: %s", a.key);
  const rs2 = fs.createReadStream(file, { encoding: 'utf8' });
  const rl2 = readline.createInterface(rs2, {});
  await reader2(rl2);
  //console.log("\n%d times", n2);
  //console.log("distance: %d", distance.length);
  distance.sort(Compare);
  console.log("\n                                                Word       Cosine distance\n--------------------------------------------------------------------------");
  for (var i = 0; i < N; i++) {
    // "%50s\t\t%f\n"
    var pad = '                                                  ';
    var str = (distance[i].key+pad).slice(0, 50);
    console.log("%s\t%f", str, distance[i].sim);
  }
}

main();
