const __dirname = path.resolve(path.dirname(''));
export default {
  init: function (config, scheme) {
    // console.log(config)
    config.phoneEnter = 'owo_scheme_loading'
    fs.writeFileSync(path.join(process.cwd(), './owo_scheme/loading.owo'), fs.readFileSync(path.join(__dirname, `./scheme/loading/loading.owo`), 'utf8'))
    config.pageList.push({
      name: 'owo_scheme_loading',
      src: './owo_scheme/loading.owo',
      prop: {
        imgList: scheme.imgList
      }
    })
    return config
  }
}