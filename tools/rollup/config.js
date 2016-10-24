import nodeResolve from 'rollup-plugin-node-resolve';
import convertCJS from 'rollup-plugin-commonjs';

export default {
  entry: 'src/js/app/main.js',
  format: 'umd',
  plugins: [ nodeResolve(), convertCJS() ],
  dest: 'src/js/bundle.js'
};
