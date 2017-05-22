const spawn = require('child_process').spawn;

let word = 'cat';

let genplot = spawn('gender-word-plots/src/genplot', ['-i', 'gender-word-plots/vectorbins/text8-vector.bin']);

genplot.stdin.write(word);
genplot.stdin.end();

genplot.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
    //Here is where the output goes
});

genplot.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
    //Here is where the error output goes
});

genplot.on('close', function(code) {
    console.log('closing code: ' + code);
    //Here you can get the exit code of the script
});

genplot.on('error', (err) => {
  console.log('Failed to start child process.');
  console.log(err);
});
