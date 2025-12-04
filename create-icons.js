#!/usr/bin/env node

const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background with rounded corners
  const radius = size / 6;
  ctx.fillStyle = '#FF9900';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size / 2}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AWS', size / 2, size / 2);
  
  return canvas;
}

// Create icons
const icon48 = createIcon(48);
const icon96 = createIcon(96);

fs.writeFileSync('icons/icon-48.png', icon48.toBuffer('image/png'));
fs.writeFileSync('icons/icon-96.png', icon96.toBuffer('image/png'));

console.log('Icons created successfully!');
