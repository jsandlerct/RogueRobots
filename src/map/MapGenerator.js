import Serpent from './archetypes/Serpent.js';
import Fork from './archetypes/Fork.js';
import Grid from './archetypes/Grid.js';

const ARCHETYPES = [Serpent, Fork, Grid];

export default class MapGenerator {
  static selectArchetype() {
    const Archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
    return new Archetype();
  }
}
