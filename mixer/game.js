class Game{
    constructor(){
        this.clock = new THREE.Clock();

        this.animations = ["Pointing", "Walking"]; 
        
		this.init();
    }
    

    init() {

        const container = document.createElement( 'div' );
        document.body.appendChild( container );

        this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
        this.camera.position.set( 100, 200, 500 );

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xa0a0a0 );
        this.scene.fog = new THREE.Fog( 0xa0a0a0, 1000, 2000 );

        let light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
        light.position.set( 0, 200, 0 );
        this.scene.add( light );

        light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 0, 200, 100 );
        light.castShadow = true;
        light.shadow.camera.top = 180;
        light.shadow.camera.bottom = - 100;
        light.shadow.camera.left = - 120;
        light.shadow.camera.right = 120;
        this.scene.add( light );

        // ground
        const mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 3000, 3000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
        mesh.rotation.x = - Math.PI / 2;
        mesh.receiveShadow = true;
        this.scene.add( mesh );

        const grid = new THREE.GridHelper( 3000, 20, 0x000000, 0x000000 );
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add( grid );

        // model
        const self = this;
        const loader = new THREE.FBXLoader();
        loader.load( 'FireFighter.fbx', function ( object ) {

            self.mixer = new THREE.AnimationMixer( object );
            self.actions = [];

            object.traverse( function ( child ) {

                if ( child.isMesh ) {

                    child.material.map = null;
                    child.castShadow = true;
                    child.receiveShadow = false;

                }

            } );

            const tloader = new THREE.TextureLoader();
            tloader.load("FireFighter.png", function(texture){
                object.traverse( function ( child ) {
                    if ( child.isMesh ) child.material.map = texture;
                });
            });
            
            self.scene.add( object );

            self.loadNextAnim(loader);
        } );

        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.shadowMap.enabled = true;
        container.appendChild( this.renderer.domElement );

        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set( 0, 150, 0 );
        this.controls.update();
        
        window.addEventListener( 'resize', function(){ self.resize();}, false );

    }

    loadNextAnim(loader){
        const anim = this.animations.pop();
        const self = this;
        
        loader.load( `${anim}.fbx`, function ( object ) {

            const action = self.mixer.clipAction( object.animations[ 0 ] );
            self.actions.push(action);

            object.traverse( function ( child ) {

                if ( child.isMesh ) {
                    
                    child.castShadow = true;
                    child.receiveShadow = false;

                }

            } );

            self.scene.add( object );
            
            if (self.animations.length>0){
                self.loadNextAnim(loader);
            }else{
                self.animate();
            }

        } );
    }
    
    stopAnimation(){
        this.mixer.stopAllAction();    
    }
    
    playAnimation(index){
        this.mixer.stopAllAction();
        const action = this.actions[index];
        action.weight = 1;
        action.fadeIn(0.5);
        action.play();
    }
    
    blendAnimations(weight){
        weight = Number(weight);
        this.mixer.stopAllAction();
        
        this.actions.forEach(function(action){
            action.fadeIn(0.5);
            action.play();
            action.weight = weight;
            weight = 1.0 - weight;
        });
    }
    
    resize() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );

    }

    animate() {
        const self = this;
        
        requestAnimationFrame( function(){ self.animate(); } );

        const delta = this.clock.getDelta();

        if ( this.mixer ) this.mixer.update( delta );

        this.renderer.render( this.scene, this.camera );
    }
}