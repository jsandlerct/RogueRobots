import Serpent from './archetypes/Serpent.js';
import Fork from './archetypes/Fork.js';
import Grid from './archetypes/Grid.js';
import DualLane from './archetypes/DualLane.js';
import OpenField from './archetypes/OpenField.js';
import Labyrinth from './archetypes/Labyrinth.js';

const ARCHETYPES = [Serpent, Fork, Grid, DualLane, OpenField, Labyrinth];

export default class MapGenerator {
  static selectArchetype() {
    const Archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
    return new Archetype();
  }
}
