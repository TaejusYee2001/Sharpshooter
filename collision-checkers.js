
/*Clamp Function
  Clamp functions clamp a value between a min and max - 
  in this case, we will clamp a line from the 'center of the cube' to the 'center of the sphere',
  between a min of 'the center of the cube' and a max of 'the outer edge of the cube' (we repeat for x, y, z)
  */
  function clamp(value, min_val, max_val) {
    return Math.max(min_val, Math.min(max_val, value));
  }

/*Returns whether there was a collision between two inputted cubes (rectangular prisms) */
export function CheckCollisionCubeCube(cube1, cube2) {
    //AABB Collision for two cubes
  
    //Checks if the right side of cube 1 is to the right of the left side of cube 2, then vice versa
    let collisionX = Boolean(
      cube1.position[0] + cube1.width >= cube2.position[0] - cube2.width &&
        cube2.position[0] + cube2.width >= cube1.position[0] - cube1.width
    );
  
    //Checks if the top of cube 1 is above the bottom of cube 2, then checks if the top of cube 2 is above the bottom of cube 1
    let collisionY = Boolean(
      cube1.position[1] + cube1.height >= cube2.position[1] - cube2.height &&
        cube2.position[1] + cube2.height >= cube1.position[1] - cube1.height
    );
  
    //Similar check in z dir
    let collisionZ = Boolean(
      cube1.position[2] + cube1.depth >= cube2.position[2] - cube2.depth &&
        cube2.position[2] + cube2.depth >= cube1.position[2] - cube1.depth
    );
  
    //If all conditions satisfied, they must be overlapping/colliding
    return collisionX && collisionY && collisionZ;
  }
  
  
  /*Returns whether there was a collision between an inputted cube and sphere */
export function CheckCollisionCubeSphere(cube, sphere) {
    //AABB Collision for a cube and a sphere
  
    //Get a line from center of cube to center of sphere
    let difference = sphere.position.minus(cube.position);
    let cube_vals = vec3(cube.width, cube.height, cube.depth);
  
    //Clamp the line so it cannot pass the edge of the cube
    let clamped = vec3(
      clamp(difference[0], -cube_vals[0], cube_vals[0]),
      clamp(difference[1], -cube_vals[1], cube_vals[1]),
      clamp(difference[2], -cube_vals[2], cube_vals[2])
    );
    //Find the closest point on the cube (to the sphere) by adding the clamped vector to the center of the cube
    let closest = cube.position.plus(clamped);
    //Create a vector from that closest point to the center of the sphere
    difference = closest.minus(sphere.position);
  
    let length = Math.sqrt(
      difference[0] ** 2 + difference[1] ** 2 + difference[2] ** 2
    ); //TODO: double check how to get length of a vec just using tinygraphics
    //If the distance from the closest point to the center is less than the sphere's radius, it must be inside the sphere
    return Boolean(length < sphere.radius);
  }
  
export function CheckCollisionRaySphere(ray, ray_origin, sphere) {
    let L = ray_origin.minus(sphere.position);
    //console.log(L);
    let b = ray.dot(L);
    //console.log(b);
    let c = L.dot(L) - sphere.radius2;
    //console.log(c);
    let t = b * b - c;
    //console.log(t);
    if (t < 0) return false;
  
    return true;
  }
  
  /* This function checks if there is a collision between an inputted ray and plane. If there is a collision, it returns the position where the ray will hit the plane.
  You need to pass in a ray direction (ray), ray origin, normal to the plane, and d value  you wish to check for collision with  
  Note: d is the d from the plane equation*/
export function CheckCollisionRayPlane(ray, ray_origin, n, d) {
    let denom = ray.dot(n);
  
    if (Math.abs(denom) <= 0.0001)
      //checking if denom will be close to 0
      return null;
    let t = -(ray_origin.dot(n) + d) / denom;
  
    if (t < 0) return null;
  
    return ray_origin.plus(ray.times(t)); //This will be a 3-coord vector
  }
  