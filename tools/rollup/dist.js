import nodeResolve from 'rollup-plugin-node-resolve';
import convertCJS from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import buble from 'rollup-plugin-buble';

export default {
  entry: 'src/js/app/main.js',
  sourceMap: 'inline',
  format: 'umd',
  plugins: [ nodeResolve(), convertCJS(), buble(), uglify() ],
  dest: 'dist/js/bundle.js'
};
