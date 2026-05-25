export const CONSOLE_FACTS: Record<string, string> = {
  "playstation5": "The PlayStation 5's DualSense controller features haptic feedback and adaptive triggers that can simulate the tension of actions, like pulling a bowstring.",
  "playstation4": "The PS4 was the first console to include a dedicated 'Share' button on the controller, revolutionizing social gaming.",
  "xbox-series-x": "The Xbox Series X is designed to be as quiet as possible, with a large fan that moves high volumes of air at low speeds.",
  "nintendo-switch": "The Nintendo Switch was the first hybrid console that could seamlessly transition from a handheld to a TV-connected device.",
  "pc": "The first video game ever created, 'Tennis for Two' (1958), was played on an analog computer, the ancestor of the modern PC.",
  "playstation3": "At launch, the PS3 was so powerful that groups of them were often chained together by researchers to create low-cost supercomputers.",
  "xbox360": "The Xbox 360 was the first console to feature an 'Achievements' system, which has since become a standard in the gaming industry.",
  "wii": "The Wii's development name was 'Revolution', and it certainly was one, introducing motion controls to a massive casual audience.",
  "playstation2": "The PS2 is the best-selling video game console of all time, with over 155 million units sold worldwide.",
  "nes": "In Japan, the NES was known as the 'Family Computer' or 'Famicom'. It saved the North American video game industry after the 1983 crash.",
  "snes": "The SNES featured the 'Mode 7' chip, which allowed for pseudo-3D effects that were groundbreaking for 16-bit consoles.",
  "nintendo-64": "The N64 was the last major home console to use cartridges until the Nintendo Switch, opting for speed over the storage capacity of CDs.",
  "game-boy": "The original Game Boy was so durable that one unit survived a barracks bombing during the Gulf War and is still functional today.",
  "sega-genesis": "In most parts of the world, this console was known as the 'Mega Drive', but it was renamed Genesis for the North American market.",
};

export const getConsoleFact = (slug: string): string | null => {
  return CONSOLE_FACTS[slug.toLowerCase()] || null;
};
