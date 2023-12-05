import { defs, tiny } from "./examples/common.js";
import { Shape_From_File } from "./examples/obj-file-demo.js";
import {Cube_Outline} from "./cube-outline.js";
import {CheckCollisionCubeCube, 
  CheckCollisionCubeSphere, 
  CheckCollisionRaySphere, 
  CheckCollisionRayPlane} from "./collision-checkers.js";
const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  hex_color,
  Shader,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Scene,
  Texture,
} = tiny;



export class FinalProject extends Scene {
  constructor() {
    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();

    // At the beginning of our program, load one of each of these shape definitions onto the GPU.
    this.shapes = {
      sphere: new defs.Subdivision_Sphere(4),
      circle: new defs.Regular_2D_Polygon(1, 15),
      cube: new defs.Cube(),
      dart: new Shape_From_File(
        "assets/Dart Models and Textures/dart_resized.obj/dart_resized.obj"
      ),
      crosshair: new Shape_From_File("assets/crosshair.obj/crosshair.obj"),
      bounding_box: new Cube_Outline(),
      balloon: new Shape_From_File("assets/balloon.obj"),
    };
    // *** Materials
    this.materials = {
      //Example material
      test: new Material(new defs.Phong_Shader(), {
        ambient: 0.5,
        diffusivity: 0.6,
        specularity: 0.1,
        color: hex_color("#ffffff"),
      }),
      floor: new Material(new defs.Phong_Shader(), {
        ambient: 0.5,
        diffusivity: 0.6,
        specularity: 0.1,
        color: hex_color("#595756"),
      }),
      white: new Material(new defs.Basic_Shader()),
      dart_metal: new Material(new defs.Textured_Phong(), {
        ambient: 0.5,
        diffusivity: 0,
        specularity: 10,
        smoothness: 10,
        texture: new Texture(
          "assets/Dart Models and Textures/dart_resized.obj/Texture_9.png"
        ),
      }),

      crosshair: new Material(new defs.Phong_Shader(), {
        diffusivity: 1,
        ambient: 0.8,
        specularity: 0,
        color: hex_color("#eb4934"),
      }),
      // Color of the Box
      red_flat: new Material(new defs.Phong_Shader(), {
        ambient: 0.4,
        diffusivity: 0.6,
        specularity: 0.5,
        color: hex_color("#990000"),
      }),

      // BG white stripe color
      off_white_flat: new Material(new defs.Phong_Shader(), {
        ambient: 0.9,
        diffusivity: 0.6,
        specularity: 0.5,
        color: hex_color("#BBBBBB"),
      }),

      // BG red stripe color
      maroon_flat: new Material(new defs.Phong_Shader(), {
        ambient: 0.9,
        diffusivity: 1.0,
        specularity: 0.5,
        color: hex_color("#660011"),
      }),
      balloon: new Material(new defs.Phong_Shader(1), {
        color: hex_color("#BC13FE"),
        ambient: 0.2,
        diffusivity: 1,
        specularity: 1,
      }),
    };
    //Note: All height/width/depth vals are half of the real height/width/depth, similar to a radius
    this.collision_cubes = { //Named collision objects
      floor: {
        position: vec3(-3, -20, 0),
        width: 40, // x
        height: 1, //y
        depth: 20, // z
        normal: vec3(0, 1, 0),
      },
      wall: {
        position: vec3(-3, 9, -21),
        width: 100, //x //x and y for wall just set to large values for now 
        height: 100, //y
        depth: 1, // z
        normal: vec3(0, 0, 1),
      },
      //This bounding box is just for visualizing/debugging dart collision, not used in actual scene 
      bounding_box: { 
        og_position: vec(null, null, null),
        position: vec3(null, null, null),
        width: 0.15, //x
        height: 0.15, //y
        depth: 0.9, //z
        velocity: vec3(null, null, null),
        stuck: false,
        up_angle: 0,
        side_angle: 0,
        twist_angle: 0,
      },
    };

    this.misc_cubes = []; //these are all cubes or rectangular bounding boxes that never need to be referred to by name -- filled in first frame
    this.balloons = []; //all balloons will be filled in here
    this.darts = [];
    /* Structure of a Dart in darts:
      dart: {
        og_position: vec3(null, null, null),
        position: vec3(null, null, null),
        width: 0.15, //x
        height: 0.15, //y
        depth: 0.9, //z
        velocity: vec3(null, null, null), //defined by dart end location
        stuck: false,
        up_angle: 0,
        side_angle: 0,
        twist_angle: 0,
      },
      */
    this.objects = {
      crosshair: {
        position: vec3(0, 2, 0),
        height: 1.5, //x
        depth: 1.5, //y
        width: 1.5, //z
        radius: 1.5,
        radius2: 1.5 ** 2,
      },
    };

    /*Matrix & Program State*/
    this.mouse_enabled_canvases = new Set();
    this.eye_location = vec3(0, 2, 40);
    this.initial_camera_location = Mat4.look_at(
      this.eye_location,
      vec3(0, 2, 0),
      vec3(0, 1, 0)
    );
    this.projection_transform_inverse = undefined;

    /*Mouse Picking*/
    this.obj_picked = true;
    this.obj_picked_pos = null;
    this.follow_mouse = true;
    this.mouse_click = true;

    /*Dart*/
    this.fire_dart = false;
    this.dart_ray = null;
    this.dart_ready = true;
    this.dart_wall_point = null;
    //Travel time and dart origin should be adjusted at same time to make sure they make sense, ex. putting dart_origin super far and travel time super low will make the velocity way too high
    this.travel_time = 1.5; //number of seconds a dart should take to travel to wall, adjust to see different speeds
    this.dart_origin = vec3(0, 2, 20); //location where the dart begins its flight path 
    this.darts_thrown = 0;
    this.max_darts = 5;

    /*Misc*/
    this.score = 0;
    this.first_frame = true;
  }

  add_mouse_controls(canvas) {
    // add_mouse_controls():  Attach HTML mouse events to the drawing canvas.
    //note that y vals on from_center are inverted
    this.mouse = { from_center: vec(0, 0) };
    const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
      vec(
        e.clientX - (rect.left + rect.right) / 2,
        e.clientY - (rect.bottom + rect.top) / 2
      );
    // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas:
    //Note that anchor here records the mouse position at the time of the event
    document.addEventListener("mouseup", (e) => {
      e.preventDefault();
      this.mouse.anchor =
        this.mouse_click && this.obj_picked ? mouse_position(e) : undefined;
    });
    canvas.addEventListener("mousedown", (e) => {
      //this.follow_mouse = false; //uncomment if crosshair should be put down on click
      this.obj_picked = false;
      this.mouse_click = !this.mouse_click;
      this.fire_dart = this.dart_ready ? true : false;
      if (this.obj_picked_pos)
        this.objects.crosshair.position = this.obj_picked_pos;
    });
    canvas.addEventListener("mousemove", (e) => {
      e.preventDefault();

      if (this.mouse.anchor) this.follow_mouse = true; //activates when mouse is up and moving
      this.mouse.from_center = mouse_position(e);
    });
    canvas.addEventListener("mouseout", (e) => {
      if (!this.mouse.anchor) this.mouse.from_center.scale_by(0);
    });
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.live_string((box) => {
      box.textContent = "Score: " + this.score;
    });
    this.new_line();

    this.live_string((box) => {
      box.textContent = "Darts Thrown: " + this.darts_thrown;
    });
    this.new_line();
    this.live_string((box) => {
      box.textContent = "Darts Left: " + (this.max_darts - this.darts_thrown);
    });
    this.new_line();
    this.live_string((box) => {
      if (this.max_darts > this.darts_thrown)
        box.textContent = "" ;
      else
        box.textContent = "Out of darts!" ;
    });
    this.new_line();
    this.key_triggered_button("go up", ["Control", "u"], () => this.attached = () => this.go_up);
  }

  /*Calculations*/

  /* Raycasts from current mouse location (viewport space) and converts the ray to world coords
    Note: does not give ray origin ; also he mentioned in class it might be less resource-intensive to do this in eye space, might look into that*/
  mouse_to_world_coords(program_state) {
    let x = (2.0 * this.mouse.from_center[0]) / 1080;
    let y = (2.0 * this.mouse.from_center[1]) / 600;
    let z = -1.0; //don't need to reverse perspective division, just set -1
    let ray_norm_parallel_proj = vec4(x, -y, z, 1.0);

    //Transform ray from projection space to eye space by multiplying by inverse of projection matrix
    let ray_ES = this.projection_transform_inverse.times(
      ray_norm_parallel_proj
    );

    //undo transformation in z dir and set to a vector
    ray_ES = vec4(ray_ES[0], ray_ES[1], -1.0, 0);

    //Convert ray from eye space to world space by multiplying by inverse of camera matrix
    //Also send it to a 3-coord vector, don't need the homog part anymore
    let ray_world = program_state.camera_inverse.times(ray_ES).to3();

    ray_world.normalize();
    return ray_world;
  }

  /*Return whether there was a collision between a given object and all other objects in the scene*/
  check_all_collisions(object) {
    let collision = false;

    Object.entries(this.collision_cubes).forEach(([key, value]) => {
      //iterate through all objects
      if (key != "crosshair" && key != "dart")
        //for now since only checking if dart collides with objects, just skip dart
        collision = collision || CheckCollisionCubeCube(value, object); //TODO: update this behavior to have any inputted object not collision check itself
    });

    for (var i = 0; i < this.misc_cubes.length; i++) {
      collision =
        collision || CheckCollisionCubeCube(this.misc_cubes[i], object);
    }
    return collision;
  }

  /*Checks whether given object collides with any balloons, pops those balloons=*/
  perform_dart_balloon_collisions(object) {
    for (var i = 0; i < this.balloons.length; i++) {
      //console.log("balloon:", this.balloons[i]);
      if (CheckCollisionCubeCube(this.balloons[i], object)) {
        this.balloons[i].popped = true;
        this.score += this.balloons[i].points;
        this.balloons[i].points =0; //set points to 0 after it's first added so it won't get re-added every frame a collision is detected
        //console.log("balloon pop!");
      }
    }
  }

  /* Returns the transformation matrix to show the inputted object as a projectile */
  calc_projectile_object(object, model_transform, t) {
    //t=0; //Uncomment this to make object freeze, for debugging
    let v = object.velocity;

    if (object.stuck) {
      t = 0; //turning t to zero makes velocity have no effect, 'freezing' the object
    }

    //Basic Projectile motion
    let og_pos = object.og_position;
    let x_pos = og_pos[0] + v[0] * t;
    let y_pos = og_pos[1] + v[1] * t - 0.5 * 9.8 * t ** 2;
    let z_pos = og_pos[2] + v[2] * t;

    //Set an old and new position so we can check for collisions with the new position
    let old_pos = object.position;
    object.position = vec3(x_pos, y_pos, z_pos);

    //Angle of object
    let old_up_angle = object.up_angle;
    let old_side_angle = object.side_angle;
    let old_twist_angle = object.twist_angle;

    //Calc instantaneous velocity to get the tangent to the flight path at each point
    let x_deriv = -1 * v[0];
    let z_deriv = -1 * v[2]; //multiplied by -1 since v is negative, need it to be positive
    let y_deriv = v[1] - 9.8 * t;

    //Use tangents to get dart angle in each direction on every frame
    let up_angle = 0;
    let side_angle = 0;
    if (Math.abs(z_deriv) > 0.0001) {
      //checking z_deriv wont be close to 0 before dividing by it
      up_angle = object.stuck ? old_up_angle : Math.atan(y_deriv / z_deriv);
      side_angle = object.stuck ? old_side_angle : Math.atan(x_deriv / z_deriv);
    }
    let twist_angle = object.stuck ? old_twist_angle : -2 * t;

    //Collision check to see if dart should keep moving or return to last valid position
    let collision_check = this.check_all_collisions(object);

    if (collision_check) {
     // console.log("Collision pos: ", object.position);
      //If there was a collision, just set dart to previous position
      model_transform = model_transform
        .times(Mat4.translation(old_pos[0], old_pos[1], old_pos[2]))
        .times(Mat4.rotation(old_up_angle, 1, 0, 0))
        .times(Mat4.rotation(old_side_angle, 0, 1, 0))
        .times(Mat4.rotation(old_twist_angle, 0, 0, 1));

      object.position = old_pos;
      object.og_position = old_pos;
      object.stuck = true; //Making dart not move once it collides with something - will prob adjust based on collision with balloon vs wall
	    if (this.darts_thrown < this.max_darts){
        this.dart_ready = true; //new dart ready whenever a dart sticks, unless they've thrown max darts
      }
    } else {
      //If no collision, place object  in next pos
      model_transform = model_transform
        .times(Mat4.translation(x_pos, y_pos, z_pos))
        .times(Mat4.rotation(up_angle, 1, 0, 0))
        .times(Mat4.rotation(side_angle, 0, 1, 0))
        .times(Mat4.rotation(twist_angle, 0, 0, 1));
      object.up_angle = up_angle;
      object.side_angle = side_angle;
      object.twist_angle = twist_angle;
    }

    return model_transform;
  }

  /*Drawing Functions*/
  draw_crosshair(context, program_state, model_transform, t) {
    //Controls how object (crosshair) follows the mouse
    if (this.follow_mouse && !this.fire_dart) {
      //Similar to checking for collision, casts a ray from mouse location and converts to world coords
      let ray_world = this.mouse_to_world_coords(program_state);
      let ray_origin = this.eye_location;
      //Checks where the ray from the mouse will intersect the crosshair plane - that is the point the crosshair should move to
      let plane_normal = vec3(0, 0, 1);

      let d = -1 * this.objects.crosshair.position[2];
      let new_pos = CheckCollisionRayPlane(
        ray_world,
        ray_origin,
        plane_normal,
        d
      ); //newpos will be null if somehow no collision - shouldn't be possible though

      new_pos[2] = this.objects.crosshair.position[2]; //overwrite z value with the real z position of the crosshair (crosshair stays in one plane)

      if (new_pos) {
        //checking its not null
        this.obj_picked_pos = new_pos;
        this.objects.crosshair.position = new_pos;
      }
    } else if (this.fire_dart) { //Initialize next dart's velocity and position for calculating projectile motion
      //console.log("Fire dart");
      this.fire_dart = false;
      this.dart_ready = false;
      
      //TODO: Right now we only check for where it will hit the wall, should adjust this to check if the ray is in the direction of the wall or the floor, then check for floor plane collision if needed
      this.dart_ray = this.mouse_to_world_coords(program_state);
      let ray_origin = this.eye_location;
      let d =
        -1 *
        (this.collision_cubes.wall.position[2] +
          this.collision_cubes.wall.depth);
      let collide_pos = CheckCollisionRayPlane(
        this.dart_ray,
        ray_origin,
        this.collision_cubes.wall.normal,
        d
      );
      this.dart_wall_point = vec3(
        collide_pos[0],
        collide_pos[1],
        this.collision_cubes.wall.position[2] + this.collision_cubes.wall.depth
      ); //last coord is the point on the real wall where the dart would hit, instead of z=0

      //Setting up initial variables so that projectile motion can be calculated for dart on each frame
      let final_time = this.travel_time; //The final time when the dart should hit the wall

      let x_pos_begin = this.dart_origin[0];
      let z_pos_begin = this.dart_origin[2];
      let y_pos_begin = this.dart_origin[1];

      /*Calculate needed velocity to reach point on the wall based on original dart position */
      this.darts[this.darts_thrown].velocity[0] =
        (this.dart_wall_point[0] - x_pos_begin) / final_time;
      this.darts[this.darts_thrown].velocity[1] =
        (this.dart_wall_point[1] - y_pos_begin + 0.5 * 9.8 * final_time ** 2) /
        final_time;
      this.darts[this.darts_thrown].velocity[2] =
        (this.dart_wall_point[2] - z_pos_begin) / final_time;
      
      this.darts[this.darts_thrown].og_position = vec3( //set up position for next dart
        x_pos_begin,
        y_pos_begin,
        z_pos_begin
      );

      //bounding box position & velocity, for debugging
      this.collision_cubes.bounding_box.og_position =
        this.darts[this.darts_thrown].og_position; 
      this.collision_cubes.bounding_box.velocity = this.darts[this.darts_thrown].velocity;

      this.darts[this.darts_thrown].drawing_this_dart = true;
      this.darts[this.darts_thrown].sim_start_time = t;
      this.darts_thrown += 1;
    }

    /*If not already following the mouse: If they click, check if they are on top of crosshair, pick up crosshair if yes*/
    //Note: This is for picking back up the crosshair, which prob will be eliminated in final product, might be useful for something else
    
        // else if (this.mouse_click){
        //     //console.log("mouse click");
        //     //mouse coords are in viewport space, so convert them
        //     //default canvas/viewport is 1080w by 600h - divide by 2
        //     this.mouse_old_pos = this.mouse.anchor;
            
        //     let ray_world = this.mouse_to_world_coords(program_state);
        //    //origin of ray is position of camera
        //    let ray_origin = this.eye_location;//check if there's a better way to get this dynamically
           
        //    if(CheckCollisionRaySphere( ray_world,ray_origin, this.objects.crosshair)){
        //         this.obj_picked =true;
                
        //    }
           
        // }
        

    //Move the crosshair to correct position to follow mouse
    model_transform = model_transform.times(
      Mat4.translation(
        this.objects.crosshair.position[0],
        this.objects.crosshair.position[1],
        this.objects.crosshair.position[2]
      )
    );
    if (this.dart_ready){ //Only draw the crosshair when a dart can be thrown
      this.shapes.crosshair.draw(context, program_state, model_transform, this.materials.crosshair);
    } 
  }
  
  /*Nafas' background drawing, with loops to add models to misc_cubes array for collision*/
  draw_background(context, program_state, t) { 
    // Scaling factor
    let scale_factor = 3.8;

    // Box
    //on the first render, add all boxes to our array of misc_cubes - this array makes collision detection simpler
    if (this.first_frame) {
      let positions = [];
      let sizes = [];

      //Back
      positions.push(vec3(0, 2, -19));
      sizes.push( vec3(8 * scale_factor, 5 * scale_factor, 0.125 * scale_factor));
      //Top
      positions.push(vec3(0, 5 * scale_factor + 2, 0.375 * scale_factor - 19));
      sizes.push(vec3(8.125 * scale_factor, 0.125 * scale_factor, 0.5 * scale_factor));
      //Bottom
      positions.push(vec3(0, -5 * scale_factor + 2, 0.375 * scale_factor - 19));
      sizes.push(vec3(-8.125 * scale_factor, 0.375 * scale_factor, 0.5 * scale_factor));
      //Left
      positions.push(vec3(-8 * scale_factor, 2, 0.375 * scale_factor - 19));
      sizes.push(vec3(0.125 * scale_factor, 5 * scale_factor, 0.5 * scale_factor));
      //Right
      positions.push(vec3(8 * scale_factor, 2, 0.375 * scale_factor - 19));
      sizes.push(vec3(0.125 * scale_factor, 5 * scale_factor, 0.5 * scale_factor));

      for (var i = 0; i < 5; i++) {
        this.misc_cubes.push({
          position: positions[i],
          width: sizes[i][0],
          height: sizes[i][1],
          depth: sizes[i][2],
        });
      }
    }

    // Draw large rectangular box
    let model_transform = Mat4.identity()
      .times(Mat4.translation(0, 2, -19))
      .times(
        Mat4.scale(8 * scale_factor, 5 * scale_factor, 0.125 * scale_factor)
      );
    this.shapes.cube.draw(
      context,
      program_state,
      model_transform,
      this.materials.red_flat
    );

    // Draw top of the box

    model_transform = Mat4.identity()
      .times(
        Mat4.translation(0, 5 * scale_factor + 2, 0.375 * scale_factor - 19)
      )
      .times(
        Mat4.scale(
          8.125 * scale_factor,
          0.125 * scale_factor,
          0.5 * scale_factor
        )
      );
    this.shapes.cube.draw(
      context,
      program_state,
      model_transform,
      this.materials.red_flat
    );

    // Draw bottom of the box

    model_transform = Mat4.identity()
      .times(
        Mat4.translation(0, -5 * scale_factor + 2, 0.375 * scale_factor - 19)
      )
      .times(
        Mat4.scale(
          -8.125 * scale_factor,
          0.375 * scale_factor,
          0.5 * scale_factor
        )
      );
    this.shapes.cube.draw(
      context,
      program_state,
      model_transform,
      this.materials.red_flat
    );

    // Draw left side of the box

    model_transform = Mat4.identity()
      .times(Mat4.translation(-8 * scale_factor, 2, 0.375 * scale_factor - 19))
      .times(
        Mat4.scale(0.125 * scale_factor, 5 * scale_factor, 0.5 * scale_factor)
      );
    this.shapes.cube.draw(
      context,
      program_state,
      model_transform,
      this.materials.red_flat
    );

    // Draw right of the box

    model_transform = Mat4.identity()
      .times(Mat4.translation(8 * scale_factor, 2, 0.375 * scale_factor - 19))
      .times(
        Mat4.scale(0.125 * scale_factor, 5 * scale_factor, 0.5 * scale_factor)
      );
    this.shapes.cube.draw(
      context,
      program_state,
      model_transform,
      this.materials.red_flat
    );

    let n = 30; // Number of pairs of stripes
    let stripe_width = 4.5;

    // The total width covered by the stripes
    let total_stripe_width = n * stripe_width * 2;

    // Create stripes that go from left to right
    for (let i = 0; i < n; i++) {
      // Calculate the position for the white stripe
      // Shift the starting position to the left edge of the box
      let white_stripe_position =
        -total_stripe_width / 2 + i * stripe_width * 2;

      // The red stripe is positioned right next to the white stripe
      let red_stripe_position = white_stripe_position + stripe_width;

      // Create setup for white stripes
      let model_transform_white = Mat4.identity()
        .times(Mat4.translation(white_stripe_position, 0, -19))
        .times(Mat4.scale(stripe_width / 2, 30, 0));

      // Create setup for red stripes
      let model_transform_maroon = Mat4.identity()
        .times(Mat4.translation(red_stripe_position, 0, -19))
        .times(Mat4.scale(stripe_width / 2, 30, 0));

      // Draw stripes
      this.shapes.cube.draw(
        context,
        program_state,
        model_transform_white,
        this.materials.maroon_flat
      );
      this.shapes.cube.draw(
        context,
        program_state,
        model_transform_maroon,
        this.materials.off_white_flat
      );
    }
  }

  /* Madurya's balloon drawing, with loops to add balloons to this.balloons array for collision checking*/
  draw_balloons(context, program_state, t) {  
    const model_transform = Mat4.identity().times(Mat4.scale(0.1, 0.1, 0.1));

    let shift_by = 5 * Math.sin(t * 3);
    let bob = 0;
    //let bob = (Math.PI / 6) * Math.sin(3 * t); //not bobbing for right now 
    const scale_up = 13;
    const z_pos = -11;


	  /*Drawing balloons */
	  //Note: Bound transforms are used to draw bounding boxes, during dev and debugging  

	  /*Row 1, balloons 1-7*/
    if (this.first_frame) { //if on first frame, define values for balloons in first row
      for (var i = -15; i < 20; i += 5) {
        this.balloons.push({
          position: vec3(i * scale_up * 0.1, 4.25 * 34 * 0.1, -5 * 28 * 0.1), //converting from scaled coords to world coords
          width: 28 * 0.1,
          height: 34 * 0.1,
          depth: 28 * 0.1,
          popped: false,
          points: 10,
        });
      }
      //console.log(this.balloons);
    }

    
	      //Note: The bounding boxes on row 1 are bigger than rows 2 and 3, we could make them smaller 
   
	  for (let i = -15; i < 20; i += 5) {
    //Loop to draw all balloons in Row 1, balloons 1-7
    	let balloon_transform = model_transform //.times(Mat4.translation(shift_by,0,0))
        .times(Mat4.scale(scale_up, scale_up, scale_up))
        .times(Mat4.translation(i, 8, z_pos))
        .times(Mat4.rotation(bob, 0, 0, 1)); // rotate wrt z

      	let color = null;
      	if (Math.abs(i) == 15) color = "#fff700";
      	else if (Math.abs(i) == 10) color = "#66ff00";
      	else if (Math.abs(i) == 5) color = "#ff7700";
      	else color = "#BC13FE";

      	if (!this.balloons[3 + i / 5].popped){
        //if this balloon isn't popped, draw it
       		this.shapes.balloon.draw(
          	context,
          	program_state,
          	balloon_transform,
          	this.materials.balloon.override({ color: hex_color(color) })
        	);
		}

		let bound_transform = model_transform
        .times(Mat4.translation(i * scale_up, 4.25 * 34, -5 * 28))
        .times(Mat4.scale(28, 34, 28));

      //this.shapes.bounding_box.draw(context, program_state, bound_transform, this.materials.white, 'LINES');
    }

    /*row 2, 8th and 9th balloon*/
    let x_offset = 13 * (0.5 * Math.sin(5 * t)) + 2; // oscillates between 0 and 1, renamed from bump to x_offset
    
    if (this.first_frame) { //Initialize two balloons that will be updated when their positions change
      for (var i = 0; i < 2; i++) {
        this.balloons.push({
          position: vec3(null, null, null),
          width: 24 * 0.1,
          height: 30 * 0.1,
          depth: 24 * 0.1,
          popped: false,
          points: 30,
        });
      }
    }
    //balloon 8
    const model_transform_4 = model_transform
      .times(Mat4.scale(scale_up, scale_up, scale_up))
      .times(Mat4.translation(x_offset, 0, z_pos))
      .times(Mat4.translation(7, 0, 0));
    if (!this.balloons[7].popped)
      this.shapes.balloon.draw(
        context,
        program_state,
        model_transform_4,
        this.materials.balloon.override({ color: hex_color("#2AAA8A") })
      );

    let bound_transform = model_transform
      .times(Mat4.scale(24, 30, 24))
      .times(Mat4.translation(x_offset / 1.9, 1.4, -5.9))
      .times(Mat4.translation(3.8, 0, 0));

    this.balloons[7].position = vec3(
      (x_offset / 1.9 + 3.8) * 24 * 0.1, //converting from scaled coords of the bounding box to world coords
      1.4 * 30 * 0.1,
      -5.9 * 24 * 0.1
    );

    //this.shapes.bounding_box.draw(context, program_state, bound_transform, this.materials.white, 'LINES');

    //balloon 9
    const model_transform_5 = model_transform
      .times(Mat4.scale(scale_up, scale_up, scale_up))
      .times(Mat4.translation(-x_offset, 0, z_pos))
      .times(Mat4.translation(-7, 0, 0));

    if (!this.balloons[8].popped)
      this.shapes.balloon.draw(
        context,
        program_state,
        model_transform_5,
        this.materials.balloon.override({ color: hex_color("#2AAA8A") })
      );
      
    bound_transform = model_transform
      .times(Mat4.scale(24, 30, 24))
      .times(Mat4.translation(-x_offset / 1.9, 1.4, -5.9)) //these numbers are from trial and error to align boxes with balloons
      .times(Mat4.translation(-3.8, 0, 0));

    this.balloons[8].position = vec3(
      (-x_offset / 1.9 - 3.8) * 24 * 0.1, //converting from these scaled coords of the bounding box to world coords 
      1.4 * 30 * 0.1,
      -5.9 * 24 * 0.1
    );
    //this.shapes.bounding_box.draw(context, program_state, bound_transform, this.materials.white, 'LINES');

    //row 3, 10th balloon 
    let shift_by_faster = 15 * Math.sin(t * 5);

    if (this.first_frame) {
      this.balloons.push({
        position: vec3(null, null, null),
        width: 24 * 0.1,
        height: 30 * 0.1,
        depth: 24 * 0.1,
        popped: false,
        points: 100,
      });
    }

    const model_transform_7 = model_transform
      .times(Mat4.scale(scale_up, scale_up, scale_up))
      .times(Mat4.translation(shift_by_faster, 0, 0))
      .times(Mat4.translation(0, -10, z_pos));
    if (!this.balloons[9].popped)
      this.shapes.balloon.draw(
        context,
        program_state,
        model_transform_7,
        this.materials.balloon.override({ color: hex_color("#0096FF") })
      );
      
	  bound_transform = model_transform
      .times(Mat4.scale(24, 30, 24))
      .times(Mat4.translation(shift_by_faster / 1.85, -2.9, -5.9));
    
      this.balloons[9].position = vec3(
      (shift_by_faster / 1.85) * 24 * 0.1, //converting from scaled coords of the bounding box to world coords
      -2.9 * 30 * 0.1,
      -5.9 * 24 * 0.1
    );
	  //this.shapes.bounding_box.draw(context,program_state,bound_transform,this.materials.white,"LINES");
  }

  /*Drawing an arbitrary floor
  Note: Not drawn currently */
  draw_floor(context, program_state, model_transform) {
    model_transform = model_transform
      .times(Mat4.translation(-3, -20, 0))
      .times(Mat4.scale(40, 1, 20));
    this.shapes.cube.draw(
      context,
      program_state,
      model_transform,
      this.materials.floor
    );
  }

  /*Drawing a wall behind box for wall collision*/
  draw_wall(context, program_state, model_transform) {
    model_transform = model_transform
      .times(Mat4.translation(-3, 9, -21))
      .times(Mat4.scale(40, 30, 1));
    this.shapes.cube.draw(
      context,
      program_state,
      model_transform,
      this.materials.test
    );
  }

  /*Loops through this.darts to draw darts that have been thrown*/
  draw_darts(context, program_state, model_transform, t) {
    for (var i=0; i<this.max_darts;i++){
      if (this.darts[i].drawing_this_dart) {
        let current_time = t - this.darts[i].sim_start_time;

        let projectile_transform = this.calc_projectile_object(
          this.darts[i],
          model_transform,
          current_time
        );
        projectile_transform = projectile_transform
          .times(Mat4.translation(0, 0, 5.64)) //Note: This 5.64 val was just trial and error to get the dart to line up with the bounding box
          .times(Mat4.scale(3, 3, 3))

          .times(Mat4.rotation(Math.PI / 2, 0, 1, 0));

        this.shapes.dart.draw(
          context,
          program_state,
          projectile_transform,
          this.materials.dart_metal
        );

        if (!this.darts[i].stuck) //don't check balloon collisions if the dart is stuck in wall
          this.perform_dart_balloon_collisions(this.darts[i]);
        //this.draw_dart_coll_box(context,program_state, model_transform,current_time); //for debugging
      }
    }
  }

  /*Draws the collision box for a dart, for debugging; currently not called; also not adapted for multiple darts */
  draw_dart_coll_box(context, program_state, model_transform, t) {
    let coll_transform = this.calc_projectile_object(
      this.collision_cubes.bounding_box,
      model_transform,
      t
    );
    coll_transform = coll_transform.times(Mat4.scale(0.15, 0.15, 0.9));
    this.shapes.bounding_box.draw(
      context,
      program_state,
      coll_transform,
      this.materials.white,
      "LINES"
    );
  }

  /*Display*/
  /* 
Note: When the dart's velocity is too high (above 20 or so) the collision does not work because the coordinates change too quickly -
- the object will be on one side of the wall in one frame, and on the other side in the next - so it never "collides" with the wall; 
or when it collides,it gets sent back to the previous frame where it was very far away from the wall.

This also means there's typically a little bit of space between the wall and the object even on slow collisions - which might be okay depending on collision behavior. 
 In our full project, this could be partially fixed with a thicker wall, a different collision system, or just keeping velocity fairly low. */

  display(context, program_state) {
    // display():  Called once per frame of animation.
    // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
    if (!context.scratchpad.controls) {
      // this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
      // Define the global camera and projection matrices, which are stored in program_state.

      program_state.set_camera(this.initial_camera_location);
    }

    if (!this.mouse_enabled_canvases.has(context.canvas)) {
      this.add_mouse_controls(context.canvas);
      this.mouse_enabled_canvases.add(context.canvas);
    }

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      0.1,
      1000
    );

    if (this.projection_transform_inverse == undefined) {
      this.projection_transform_inverse = Mat4.inverse(
        program_state.projection_transform
      );
    }

    /*Lighting*/
    // The parameters of the Light are: position, color, size
    const light_position = vec4(-10, 10, 20, 1);
    // The parameters of the Light are: position, color, size
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

    const t = program_state.animation_time / 1000,
      dt = program_state.animation_delta_time / 1000;

      
    let model_transform = Mat4.identity();

    /*Drawing*/
    this.draw_background(context, program_state, model_transform, t);
     this.draw_balloons(context, program_state, t);
    //this.draw_floor(context, program_state, model_transform);
    this.draw_wall(context, program_state, model_transform);
    
    
    /*Set up array of darts*/
    if (this.first_frame) 
    {
      for (var i=0; i<this.max_darts;i++){
        this.darts.push({
          og_position: vec3(null, null, null),
          position: vec3(null, null, null),
          width: 0.15, //x
          height: 0.15, //y
          depth: 0.9, //z
          velocity: vec3(null, null, null), //defined by dart end location
          stuck: false,
          up_angle: 0,
          side_angle: 0,
          twist_angle: 0,
          drawing_this_dart: false,
          sim_start_time: null,

        });
      }
      this.first_frame = false;
    }

    //Draw crosshair, only when they still can throw darts
    if (this.darts_thrown < this.max_darts) 
      this.draw_crosshair(context, program_state, model_transform, t);
    
    //Draw the darts that have been thrown
    this.draw_darts(context, program_state, model_transform, t);

    //move camera
    this.go_up = Mat4.inverse(this.initial_camera_location.times(Mat4.translation(0, 50, 0)));

    if (this.attached != undefined) {
      program_state.set_camera(this.attached().map((x,i) =>
          Vector.from(program_state.camera_inverse[i]).mix(x, 0.1)))
    }
  }
  
}

