import { defs, tiny } from "./examples/common.js";
const {Shape, Vector3, color} = tiny;
export class Cube_Outline extends Shape {
    constructor() {
      super("position", "color");
      //Cube outline from Assignment 2
      // When a set of lines is used in graphics, you should think of the list entries as
      // broken down into pairs; each pair of vertices will be drawn as a line segment.
      // Note: since the outline is rendered with Basic_shader, you need to redefine the position and color of each vertex
  
      this.arrays.position = Vector3.cast(
        [-1, -1, -1],
        [-1, 1, -1],
        [-1, 1, -1],
        [1, 1, -1],
        [1, 1, -1],
        [1, -1, -1],
        [1, -1, -1],
        [-1, -1, -1],
        [1, -1, -1],
        [1, -1, 1],
        [1, -1, 1],
        [-1, -1, 1],
        [-1, -1, 1],
        [-1, -1, -1],
        [1, -1, 1],
        [1, 1, 1],
        [1, 1, 1],
        [-1, 1, 1],
        [-1, 1, 1],
        [-1, -1, 1],
        [-1, 1, 1],
        [-1, 1, -1],
        [1, 1, -1],
        [1, 1, 1]
      );
      this.arrays.color = [
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
        color(1, 1, 1, 1.0),
      ]; //set to full white
  
      this.indices = false;
    }
  }