/** CSci-4611 Example Code
 * Copyright 2023+ Regents of the University of Minnesota
 * Please do not distribute beyond the CSci-4611 course
 */

/* Lecture 26
 * CSCI 4611, Spring 2023, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'
import { GUI } from 'dat.gui'


export class ExampleApp extends gfx.GfxApp
{
    private cameraControls: gfx.OrbitControls;

    // Perspective camera parameters
    public verticalFov: number;
    public aspectRatio: number;

    // Orthographic camera parameters
    public orthoWidth: number;
    public orthoHeight: number;

    // Shared camera parameters
    public nearClip: number;
    public farClip;

    public projectionMode: string;

    constructor()
    {
        super();

        this.cameraControls = new gfx.OrbitControls(this.camera); 

        this.verticalFov = 60;
        this.aspectRatio = 1.777;

        this.orthoWidth = 800;
        this.orthoHeight = 450.196;

        this.nearClip = 1;
        this.farClip = 2000;

        this.projectionMode = 'Perspective';

        // This sets up a default camera that won't show anything.
        // We are going to manually compute the projection matrix.
        this.camera.setOrthographicCamera(0, 1.777, 0, 1, 0.01, 1);
    }

    createScene(): void 
    {
        // Initialize the camera using our custom projection matrix
        this.setCameraProjection();

        // Configure camera controls
        this.cameraControls.setDistance(600);
        this.cameraControls.zoomSpeed = 10;

        // Create the scene lighting
        const sceneLight = new gfx.DirectionalLight();
        sceneLight.ambientIntensity.set(0.5, 0.5, 0.5);
        sceneLight.diffuseIntensity.set(0.5, 0.5, 0.5);
        sceneLight.position.set(1, 1, -1);
        this.scene.add(sceneLight);

        // Create the skybox material
        const skyboxMaterial = new gfx.UnlitMaterial();
        skyboxMaterial.color.set(0.749, 0.918, 0.988);
        skyboxMaterial.side = gfx.Side.BACK;

        // Add the skybox to the scene
        const skybox = gfx.Geometry3Factory.createBox(1000, 1000, 1000);
        skybox.material = skyboxMaterial;
        this.scene.add(skybox);

        // Create the ground material
        const groundMaterial = new gfx.UnlitMaterial();
        groundMaterial.setColor(new gfx.Color(0.5, 0.5, 0.5));

        // Add the ground mesh to the scene
        const ground = gfx.Geometry3Factory.createBox(510, 1, 510);
        ground.position.set(0, -.5, 0);
        ground.material = groundMaterial;
        this.scene.add(ground);

        const column = gfx.Geometry3Factory.createBox(15, 1, 15);
        for(let i=-250; i <= 250; i+=20)
        {
            for(let j=-250; j <= 250; j+=20)
            {
                const columnHeight = Math.random() * 55 + 5;
                const columnMaterial = new gfx.GouraudMaterial();
                columnMaterial.setColor(new gfx.Color(Math.random(), Math.random(), Math.random()));

                const columnInstance = column.createInstance(false);
                columnInstance.position.set(i, columnHeight/2, j);
                columnInstance.scale.set(1, columnHeight, 1);
                columnInstance.material = columnMaterial;
                this.scene.add(columnInstance);
            }
        }

        // Create the GUI
        const gui = new GUI();
        gui.width = 200;

        const projectionController = gui.add(this, 'projectionMode', [
            'Perspective',
            'Orthographic',
            'Isometric'
        ]);
        projectionController.name('Projection');
        projectionController.onChange(()=>{ this.setCameraProjection() });

        const nearClipController = gui.add(this, 'nearClip');
        nearClipController.onChange(()=>{ this.setCameraProjection() });

        const farClipController = gui.add(this, 'farClip');
        farClipController.onChange(()=>{ this.setCameraProjection() });

        const perspectiveControls = gui.addFolder('Perspective Camera Settings');
        perspectiveControls.open();

        const fovController = perspectiveControls.add(this, 'verticalFov');
        fovController.onChange(()=>{ this.setCameraProjection() });

        const aspectRatioController = perspectiveControls.add(this, 'aspectRatio');
        aspectRatioController.onChange(()=>{ this.setCameraProjection() });

        const orthographicControls = gui.addFolder('Orthographic Camera Settings');
        orthographicControls.open();

        const orthoWidthController = orthographicControls.add(this, 'orthoWidth');
        orthoWidthController.onChange(()=>{ this.setCameraProjection() });

        const orthoHeightController = orthographicControls.add(this, 'orthoHeight');
        orthoHeightController.onChange(()=>{ this.setCameraProjection() });
    }

    update(deltaTime: number): void 
    {
        if(this.projectionMode != 'Isometric')
        {
            this.cameraControls.update(deltaTime);
        }
    }

    setCameraProjection(): void
    {
        if(this.projectionMode == 'Perspective')
        {
            // See course slides for perspective matrix equation

            const n = this.nearClip;
            const f = this.farClip;
            const top = n * Math.tan(gfx.MathUtils.degreesToRadians(this.verticalFov) / 2);
            const bottom = -top;
            const right = top * this.aspectRatio;
            const left = -right;

            this.camera.projectionMatrix.setRowMajor(
                (2 * n) / (right-left), 0, (right + left) / (right - left), 0,
                0, (2 * n) / (top - bottom), (top + bottom) / (top - bottom), 0,
                0, 0, -(f + n) / (f - n), (-2 * f * n) / (f - n),
                0, 0, -1, 0
            );
        }
        else
        {
            // http://learnwebgl.brown37.net/08_projections/projections_ortho.html

            const translation = new gfx.Vector3();
            translation.x = 0;
            translation.y = 0;
            translation.z = (this.farClip - this.nearClip) / 2;

            const scale = new gfx.Vector3();
            scale.x = 2 / this.orthoWidth;
            scale.y = 2 / this.orthoHeight;
            scale.z = -2 / (this.farClip - this.nearClip);


            this.camera.projectionMatrix.setTranslation(translation);
            this.camera.projectionMatrix.premultiply(gfx.Matrix4.makeScale(scale));

            // An isometric view uses an orthographic projection matrix and a specific viewing angle
            // https://en.wikipedia.org/wiki/Isometric_projection

            if(this.projectionMode == 'Isometric')
            {                
                const camRot = gfx.Quaternion.makeRotationY(gfx.MathUtils.degreesToRadians(45));
                camRot.multiply(gfx.Quaternion.makeRotationX(gfx.MathUtils.degreesToRadians(-35.364)));
                this.camera.rotation.copy(camRot);

                const camPos = new gfx.Vector3(0, 0, 550);
                camPos.rotate(this.camera.rotation);
                this.camera.position.copy(camPos);                
            }
        }

        // Resize the viewport based on the camera aspect ratio
        this.resize();
    }

    // Override the default resize event handler
    resize(): void
    {
        if(this.projectionMode == 'Perspective')
            this.renderer.resize(window.innerWidth, window.innerHeight, this.aspectRatio);
        else
            this.renderer.resize(window.innerWidth, window.innerHeight, this.orthoWidth / this.orthoHeight);
    }
}