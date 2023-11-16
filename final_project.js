import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from './examples/obj-file-demo.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, 
} = tiny;

/*Can delete cube outline later, just used for deciding bounding boxes*/
class Cube_Outline extends Shape {
    constructor() {
        super("position", "color");
        //  (Requirement 5).
        // When a set of lines is used in graphics, you should think of the list entries as
        // broken down into pairs; each pair of vertices will be drawn as a line segment.
        // Note: since the outline is rendered with Basic_shader, you need to redefine the position and color of each vertex

        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [-1, 1, -1],
            [-1, 1, -1], [1, 1, -1],
            [1, 1, -1], [1, -1, -1],
            [1, -1, -1], [-1, -1, -1],
            [1, -1, -1], [1, -1, 1],
            [1, -1, 1], [-1, -1, 1],
            [-1, -1, 1], [-1, -1, -1],
            [1, -1, 1], [1, 1, 1],
            [1, 1, 1], [-1, 1, 1],
            [-1, 1, 1], [-1, -1, 1],
            [-1, 1, 1], [-1, 1, -1],
            [1, 1, -1], [1, 1, 1]);
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
            color(1, 1, 1, 1.0)
        ]; //set to full white


        this.indices=false;
    }
}

function CheckCollisionCubeCube(cube1, cube2){
    //AABB Collision for two cubes 
    
    //Checks if the right side of cube 1 is to the right of the left side of cube 2, then vice versa
    let collisionX = Boolean((cube1.position[0] + cube1.width)  >= (cube2.position[0] - cube2.width) && 
        (cube2.position[0] + cube2.width) >= (cube1.position[0] - cube1.width));
    
    //Checks if the top of cube 1 is above the bottom of cube 2, then checks if the top of cube 2 is above the bottom of cube 1
    let collisionY = Boolean((cube1.position[1] + cube1.height) >= (cube2.position[1] - cube2.height) && 
    (cube2.position[1] + cube2.height) >= (cube1.position[1] - cube1.height));
    
    //Similar check in z dir
    let collisionZ = Boolean(cube1.position[2] + cube1.depth >= (cube2.position[2] - cube2.depth) && 
    cube2.position[2] + cube2.depth >= (cube1.position[2] - cube1.depth));

    //If all conditions satisfied, they must be overlapping/colliding
    return collisionX && collisionY && collisionZ; 

}
/*Clamp Function
Clamp functions clamp a value between a min and max - 
in this case, we will clamp a line from the 'center of the cube' to the 'center of the sphere',
between a min of 'the center of the cube' and a max of 'the outer edge of the cube' (we repeat for x, y, z)
*/
function clamp(value,min_val, max_val){
    return Math.max(min_val, Math.min(max_val,value));
}

function CheckCollisionCubeSphere(cube, sphere){
    //AABB Collision for a cube and a sphere

    
    //Get a line from center of cube to center of sphere
    let difference = sphere.position.minus(cube.position) ; 
    let cube_vals = vec3(cube.width,cube.height,cube.depth);
    
    //Clamp the line so it cannot pass the edge of the cube
    let clamped =  vec3(
        clamp(difference[0], -cube_vals[0], cube_vals[0]),
        clamp(difference[1], -cube_vals[1], cube_vals[1]),
        clamp(difference[2], -cube_vals[2], cube_vals[2]),
    );
    //Find the closest point on the cube (to the sphere) by adding the clamped vector to the center of the cube
    let closest = cube.position.plus(clamped);
    //Create a vector from that closest point to the center of the sphere
    difference = closest.minus(sphere.position);
    
    let length = Math.sqrt((difference[0]**2)+(difference[1]**2)+(difference[2]**2)); //TODO: double check how to get length of a vec just using tinygraphics
    //If the distance from the closest point to the center is less than the sphere's radius, it must be inside the sphere
    return Boolean(length < sphere.radius);
}
function CheckCollisionRaySphere(program_state, ray, ray_origin, sphere){
    

    let L = ray_origin.minus(sphere.position);
    //console.log(L);
    let b = ray.dot(L);
    //console.log(b);
    let c = L.dot(L) - sphere.radius2;
    //console.log(c);
    let t = b*b -c;
    //console.log(t);
    if (t<0)
        return false;

    return true;

}
/* This function checks if their is a collision between an inputted ray and plane. If there is a collision, it returns the position where the ray will hit the plane.
You need to pass in a ray direction (ray), ray origin, and normal to the plane you wish to check for collision with  */
function CheckCollisionRayPlane(program_state, ray, ray_origin, n){

   // let n = vec3(0,0,1); this is just the normal for the xy, z=0 plane
    
    let d =0;
    
    let denom = ray.dot(n); 
    
    if (Math.abs(denom) <= 0.0001) //checking if denom will be close to 0
        return null;
    let t = -( ray_origin.dot(n) + d) / (denom);
    
    if (t<0)
        return null;
    
    return ray_origin.plus(ray.times(t)); //This will be a 3-coord vector 
}

export class FinalProject extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            cube: new defs.Cube(),
            dart: new Shape_From_File("assets/Dart Models and Textures/dart_resized.obj/dart_resized.obj"),
            crosshair: new Shape_From_File("assets/crosshair.obj/crosshair.obj"),
            bounding_box: new Cube_Outline(),
        };

        // *** Materials
        this.materials = {
            //Example material
            test: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: .6, specularity: 0.1, color: hex_color("#ffffff")}),
            floor: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: .6, specularity: 0.1, color: hex_color("#595756")}),    
           white:new Material(new defs.Basic_Shader()),
        //TODO: Figure out how to give basic shader a color, just want the crosshair to be plain red with basically no shading
           crosshair: new Material(new defs.Phong_Shader(),
           { diffusivity: 1, specularity:0,  color: hex_color("#eb4934")}),
        }
        

        this.objects={
            dart:
            {
                og_position: vec3(0,0,0), //Adjust the darts's original position 
                position : vec3(0,0,0),
                height: 0.125, //y
                width:0.125, //x
                depth:0.75, //z
                velocity: vec3(0,11,11), 
                stuck:false,
                angle:0,
               
            },
            floor:
            {
                position: vec3(-3,20,0),
                width:40, //half of real width, x
                height: 1, //y
                depth:20, //half of real depth , z
            
            },
            wall:
            {
                position: vec3(-3,9,-21),
                width:40, //half of real width, x
                height: 30, //y
                depth:1 //half of real depth , z
            },
            crosshair:{
                position:vec3(0,2,0),
                height:1, //Note these are the half height/width/depth vals
                depth:1,
                width:1,
                radius:1,
                radius2: 1**2,
            },
            bounding_box:{
                
                og_position: vec3(0,0,0),  
                position : vec3(0,0,0),
                height: 0.125, //y
                width:0.125, //x
                depth:0.75, //z
                velocity: vec3(0,11,11), 
                stuck:false,
                angle:0,
               
            },
        }
        this.mouse_enabled_canvases = new Set();
        //this.will_take_over_graphics_state = true;
        this.eye_location = vec3(0,2,40);
        this.initial_camera_location = Mat4.look_at(this.eye_location, vec3(0, 2, 0), vec3(0, 1, 0));
        this.projection_transform_inverse = undefined;
        this.obj_picked = true;
        this.obj_picked_pos = null;
        this.follow_mouse = true;
        this.mouse_click=true;
        //this.mouse_old_pos=null;
    }
    add_mouse_controls(canvas) {
        // add_mouse_controls():  Attach HTML mouse events to the drawing canvas.
        //note that y vals on from_center are inverted
        this.mouse = {"from_center": vec(0, 0)};
        const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
            vec(e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
        // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas:
       //Note that anchor here records the mouse position at the time of the event
        document.addEventListener("mouseup", e => {
           // console.log(this.mouse.from_center);
           e.preventDefault();
            //console.log(this.mouse.from_center);

            this.mouse.anchor = mouse_position(e);
        });
        canvas.addEventListener("mousedown", e => {
            
            this.follow_mouse = false;
           this.obj_picked = false;
           this.mouse_click= !this.mouse_click;
            this.mouse.anchor = this.mouse_click ? mouse_position(e): undefined;
            if (this.obj_picked_pos)
                this.objects.crosshair.position = this.obj_picked_pos;
        });
        canvas.addEventListener("mousemove", e => {
            e.preventDefault();
            //console.log(this.mouse.from_center);
            if  (this.mouse.anchor &&this.mouse_click){
                this.follow_mouse = true; //activates when mouse is down and moving
            }
            this.mouse.from_center = mouse_position(e);
            
        });
        canvas.addEventListener("mouseout", e => {
            //console.log(this.mouse.from_center);

            if (!this.mouse.anchor) this.mouse.from_center.scale_by(0)
        });
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        
        
        
        

    }
    
    /*Helpers*/

    draw_floor(context,program_state,model_transform){
        //Drawing an arbitrary floor
        model_transform = model_transform
        .times(Mat4.translation(-3,-20,0))
        .times(Mat4.scale(40,1,20));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.floor);
    }

    draw_wall(context,program_state,model_transform){
        //Drawing an arbitrary wall
        model_transform = model_transform
        .times(Mat4.translation(-3,9,-21))
        .times(Mat4.scale(40,30,1))
        ;
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.test);
    }

    draw_dart_coll_box(context,program_state, model_transform,t){
        
        let projectile_transform = this.calc_projectile_object(this.objects.bounding_box,context,program_state, model_transform, t);
        projectile_transform = projectile_transform
        .times(Mat4.scale(0.125,0.125,0.75))
        //.times(Mat4.translation(2.26,-1.05,0));
        //.times(Mat4.translation(6.26,-0.05,0))
        ;
        this.shapes.bounding_box.draw(context, program_state, projectile_transform, this.materials.white, "LINES");

    }
    draw_crosshair_drag(context,program_state, model_transform){
        //if the mouse is moving while pressed down and some object has been picked
        if (this.follow_mouse && this.obj_picked){    
            //Similar to checking for collision, casts a ray from mouse location and converts to world coords
            let x = (2.0*this.mouse.from_center[0])/1080;
            let y = (2.0*this.mouse.from_center[1]) /600;
            let z = -1.0; 
            let ray_proj = vec4(x,-y,z,1.0);
           
            let ray_ES = this.projection_transform_inverse.times(ray_proj);
            
            ray_ES = vec4(ray_ES[0],ray_ES[1],-1.0,0);
            let ray_world = (program_state.camera_inverse.times(ray_ES)).to3();

            ray_world.normalize(); 
            let ray_origin = this.eye_location;
            //Checks where the ray from the mouse will intersect the xy plane - that is the point the object should move to 
            let z_plane_normal = vec3(0,0,1);
            let new_pos = CheckCollisionRayPlane(program_state, ray_world, ray_origin, z_plane_normal);
            //console.log(new_pos);
            
            //Transform the model matrix to move the object to the new point 
            if (new_pos){ //checking its not null
                this.obj_picked_pos = new_pos;
                this.objects.crosshair.position = new_pos;
            }
            
        }
        /*When mouse pressed down, check if on top of object*/
        else if (this.mouse.anchor){
            //mouse coords are in viewport space, so convert them
            //default canvas/viewport is 1080w by 600h - divide by 2
            this.mouse_old_pos = this.mouse.anchor;
            let x = (2.0*this.mouse.from_center[0])/1080;
            let y = (2.0*this.mouse.from_center[1]) /600;
            let z = -1.0; //don't need to reverse perspective division, just set -1
            let ray_norm_parallel_proj = vec4(x,-y,z,1.0);
            

            //Transform ray from projection space to eye space by multiplying by inverse of projection matrix
            let ray_ES = this.projection_transform_inverse.times(ray_norm_parallel_proj);
            

            //undo transformation in z dir and set to a vector 
            ray_ES = vec4(ray_ES[0],ray_ES[1],-1.0,0);
            

            //Convert ray from eye space to world space by multiplying by inverse of camera matrix
            //Also send it to a 3-coord vector, don't need the homog part anymore
            let ray_world = (program_state.camera_inverse.times(ray_ES)).to3();
            
            
            ray_world.normalize(); 
            
           //origin of ray is position of camera
           let ray_origin = this.eye_location;//check if there's a better way to get this dynamically
           
           if(CheckCollisionRaySphere(program_state, ray_world,ray_origin, this.objects.crosshair)){
                this.obj_picked =true;
                
           }
           
        }
        //Move the object to correct position 
        model_transform = model_transform.times(Mat4.translation(this.objects.crosshair.position[0],this.objects.crosshair.position[1],this.objects.crosshair.position[2]));
        //model_transform = model_transform.times(Mat4.scale(2.5,2.5,2.5));
        this.shapes.crosshair.draw(context,program_state,model_transform,this.materials.crosshair);
        
    }


    /* Returns the transformation matrix to show the inputted object as a projectile */
    calc_projectile_object(object, context, program_state,model_transform, t){
        //t=0; //Comment this out to make object move
        let v = object.velocity;
        let z_coeff = -1;
        //Z coeff needs to be 1 when the object is stuck, otherwise both og_pos and coeff are negative, making a positive z value - it should be negative
        if(object.stuck){
             z_coeff = 1; 
             t = 0; //turning t to zero makes velocity have no effect, 'freezing' the object
        }
        
        //Basic Projectile motion
        let og_pos = object.og_position;
        let z_pos = z_coeff*(og_pos[2] + v[2]*t); //z is multiplied by -1 so it goes away from camera
        let y_pos = og_pos[1] + v[1]*t - (.5*9.8*(t**2));
        let x_pos = 0;

        //Set an old and new position so we can check for collisions with the new position
        let old_pos = object.position;
        object.position = vec3(x_pos,y_pos,z_pos);

        //Angle of object
        let old_angle = object.angle;
        //console.log("Old angle:", old_angle);
        let z_deriv = v[2];
        let y_deriv = v[1] - 9.8*t;
        let angle = object.stuck ? old_angle : Math.atan(y_deriv/z_deriv); //6.26,-0.05
        
         //model_transform = model_transform.times(Mat4.rotation(angle,0,0,1));
        //TODO: Check if theres a better way to organize/perform all collisions
        let collisionWall = Boolean(CheckCollisionCubeCube(this.objects.wall, object));
        let collisionFloor = Boolean(CheckCollisionCubeCube(this.objects.floor, object));

        if ( collisionWall|| collisionFloor){
            //If there was a collision, just set object to previous position - in our project, balloon would probably disappear and dart might too 
            //console.log(object.position)
            //console.log("Collision!"); //for debugging
            model_transform = model_transform
            .times(Mat4.translation(old_pos[0],old_pos[1],old_pos[2]))
            .times(Mat4.rotation(old_angle,1,0,0));
            
            object.position = old_pos;
            object.og_position = old_pos;
            object.stuck = true; //Making object not move once it collides with something - arbitrary behavior
            
        }
        else{
            //If no collision, place object  in next pos
            model_transform = model_transform
            .times(Mat4.translation(x_pos,y_pos,z_pos))
            .times(Mat4.rotation(angle,1,0,0));
            object.angle = angle;
            
        ;
        }
        
        
        
       //Should output a model transform to draw your object
        //this.shapes.dart.draw(context,program_state,model_transform,this.materials.test);
        return model_transform; 
    }
    draw_dart(context,program_state,model_transform, t){
        let projectile_transform = this.calc_projectile_object(this.objects.dart,context,program_state, model_transform, t);
        projectile_transform = projectile_transform
        .times(Mat4.translation(0,0,4.70)) //Note: This -4.70 val was just trial and error to get the dart to line up with the bounding box 
        .times(Mat4.scale(2.5,2.5,2.5))
        .times(Mat4.rotation(Math.PI/2,0,1,0));

        this.shapes.dart.draw(context,program_state,projectile_transform,this.materials.test);
        
    }

/*Display*/
/* 
The velocity can be adjusted in this.objects. The objects will stick when they collide with the floor or wall.

Note: When the velocity is too high (above 20 or so) the collision does not work because the coordinates change too quickly -
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
            Math.PI / 4, context.width / context.height, .1, 1000);

        if (this.projection_transform_inverse == undefined){
            this.projection_transform_inverse = Mat4.inverse(program_state.projection_transform);
        }

        /*Lighting*/
        const light_position = vec4(0, 5, 5, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        
        let model_transform = Mat4.identity();
        
        /*Drawing*/
        this.draw_floor(context,program_state, model_transform);
        this.draw_wall(context,program_state,model_transform);
        
       this.draw_dart(context,program_state,model_transform,t);
        //Collision box for the dart - will be removed later, just for visualizing
        this.draw_dart_coll_box(context,program_state, model_transform,t);

        /*Moving the dart when picked*/
        this.draw_crosshair_drag(context,program_state, model_transform);
        
        
        
       
    }
}




/*This is the old version of projectile motion that  models the dart and collisions as a sphere
In the new version, I model all object collisions with bounding boxes.
Keeping the old one might be useful once we switch to collisions w/ the balloons 
-- balloon collision could probably be modeled as bounding sphere and a bounding box
*/
/*
calc_projectile_object(object, context, program_state,model_transform, t){
    //t=0; //Comment this out to make object move
    let v = object.velocity;
    if(object.stuck)
     t = 0;
    //Basic Projectile motion
    let og_pos = object.og_position;
    let x_pos = og_pos[0] + v[0]*t;
    let y_pos = og_pos[1] + v[1]*t - (.5*9.8*(t**2));
    let z_pos = 0;

    //Set an old and new position so we can check for collisions with the new position
    let old_pos = object.position;
    object.position = vec3(x_pos,y_pos,z_pos);

    //Angle of dart 
    let old_angle = object.angle;
    //console.log("Old angle:", old_angle);
    let x_deriv = v[0];
    let y_deriv = v[1] - 9.8*t;
    let angle = object.stuck ? old_angle : Math.atan(y_deriv/x_deriv);
     //model_transform = model_transform.times(Mat4.rotation(angle,0,0,1));
    //TODO: Check if theres a better way to organize/perform all collisions
    let collisionWall = Boolean(CheckCollisionCubeSphere(this.objects.wall, object));
    let collisionFloor = Boolean(CheckCollisionCubeSphere(this.objects.floor, object));

    if ( collisionWall|| collisionFloor){
        //If there was a collision, just set ball to previous position - in our project, balloon would probably disappear and dart might too 
        //console.log(this.objects.ball.position)
        //console.log("Collision!"); //for debugging
        model_transform = model_transform
        .times(Mat4.translation(old_pos[0],old_pos[1],old_pos[2]))
        .times(Mat4.rotation(old_angle,0,0,1));
        //TODO: fix angling cus for some reason it reverts to 45 deg angle 
        //this.objects.ball.angle = old_angle;
        object.position = old_pos;
        object.og_position = old_pos;
        object.stuck = true; //Making ball not move once it collides with something - arbitrary behavior
        
    }
    else{
        //If no collision, place ball in next pos
        model_transform = model_transform
        .times(Mat4.translation(x_pos,y_pos,z_pos))
        .times(Mat4.rotation(angle,0,0,1));
        object.angle = angle;
        
    ;
    }
    
    model_transform = model_transform.times(Mat4.scale(2.5,2.5,2.5));
    
   //Should output a model transform to draw your object
    //this.shapes.dart.draw(context,program_state,model_transform,this.materials.test);
    return model_transform; 
}
*/