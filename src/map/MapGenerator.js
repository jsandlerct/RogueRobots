import Serpent from './archetypes/Serpent.js';
import Fork from './archetypes/Fork.js';
import Grid from './archetypes/Grid.js';
import DualLane from './archetypes/DualLane.js';
import OpenField from './archetypes/OpenField.js';
import Labyrinth from './archetypes/Labyrinth.js';
import Bottleneck from './archetypes/Bottleneck.js';
import Staircase from './archetypes/Staircase.js';
import Crossroads from './archetypes/Crossroads.js';
import Gauntlet from './archetypes/Gauntlet.js';

const ARCHETYPES = [Serpent, Fork, Grid, DualLane, OpenField, Labyrinth, Bottleneck, Staircase, Crossroads, Gauntlet];

export default class MapGenerator {
  static selectArchetype() {
    const Archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
    return new Archetype();
  }
}
