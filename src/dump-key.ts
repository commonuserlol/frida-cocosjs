function main(module: Module) {
  const jsb_set_xxtea_key = module.getExportByName(
    "_Z17jsb_set_xxtea_keyRKNSt6__ndk112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE",
  );

  Interceptor.attach(jsb_set_xxtea_key, {
    onEnter(args) {
      const isTiny = (args[0].readU8() & 1) === 0;
      const data = isTiny
        ? args[0].add(1)
        : args[0].add(2 * Process.pointerSize).readPointer();
      console.log(`Key: ${data.readUtf8String()}`);
    },
  });
}

const i = setInterval(() => {
  const module = Process.findModuleByName("libcocos2djs.so");
  if (!module) return;

  clearInterval(i);
  main(module);
}, 50);
