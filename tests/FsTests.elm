module FsTests exposing (fsTests)

import Expect
import Os exposing (..)
import Test exposing (..)


bin : Fs
bin =
    Dir
        ( [ "usr" ]
        , "bin"
        , [ File ( [ "usr", "bin" ], "echo", 1 )
          , File ( [ "usr", "bin" ], "cd", 1 )
          ]
        )


usr : Fs
usr =
    Dir
        ( []
        , "usr"
        , [ bin ]
        )


root : Fs
root =
    Dir
        ( []
        , ""
        , [ File ( [], "root.txt", 0 )
          , usr
          ]
        )


atUsr : System
atUsr =
    { root = root
    , current = usr
    }


atRoot : System
atRoot =
    { root = root
    , current = root
    }


fsTests : Test
fsTests =
    describe "test Os module"
        [ describe "queryPath"
            [ test "root" <|
                \_ -> Expect.equal (queryPath atRoot []) (Just root)
            , test "root.txt" <|
                \_ -> Expect.equal (queryPath atRoot [ "root.txt" ]) (Just (File ( [], "root.txt", 0 )))
            , test "echo" <|
                \_ -> Expect.equal (queryPath atRoot [ "usr", "bin", "echo" ]) (Just (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo" <|
                \_ -> Expect.equal (queryPath atUsr [ "bin", "echo" ]) (Just (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo 2" <|
                \_ -> Expect.equal (queryPath atUsr [ ".", "bin", "echo" ]) (Just (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative root.txt" <|
                \_ -> Expect.equal (queryPath atUsr [ "..", "root.txt" ]) (Just (File ( [], "root.txt", 0 )))
            , test "not found" <|
                \_ -> Expect.equal (queryPath atRoot [ "usr", "bin", "ech" ]) Nothing
            ]
        , describe "resolvePath"
            [ test "root" <|
                \_ -> Expect.equal (resolvePath atRoot "/") (Succes root)
            , test "root.txt" <|
                \_ -> Expect.equal (resolvePath atUsr "/root.txt") (Succes (File ( [], "root.txt", 0 )))
            , test "root.txt not dir" <|
                \_ -> Expect.equal (resolvePath atUsr "/root.txt/") (IsNotDir (File ( [], "root.txt", 0 )))
            , test "echo" <|
                \_ -> Expect.equal (resolvePath atUsr "/usr/bin/echo") (Succes (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo" <|
                \_ -> Expect.equal (resolvePath atUsr "bin/echo") (Succes (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo not dir" <|
                \_ -> Expect.equal (resolvePath atUsr "bin/echo/") (IsNotDir (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo 2" <|
                \_ -> Expect.equal (resolvePath atUsr "./bin/echo") (Succes (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative dir" <|
                \_ -> Expect.equal (resolvePath atUsr "./bin/") (Succes bin)
            , test "relative root.txt" <|
                \_ -> Expect.equal (resolvePath atUsr "../root.txt") (Succes (File ( [], "root.txt", 0 )))
            , test "not found" <|
                \_ -> Expect.equal (resolvePath atRoot "/usr/bin/ech") NotFound
            ]
        , describe "resolveExe"
            [ test "absulute echo" <|
                \_ -> Expect.equal (resolveExe atUsr "/usr/bin/echo") (Succes (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo" <|
                \_ -> Expect.equal (resolveExe atUsr "./bin/echo") (Succes (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "path echo" <|
                \_ -> Expect.equal (resolveExe atUsr "echo") (Succes (File ( [ "usr", "bin" ], "echo", 1 )))
            , test "relative echo IsNotDir" <|
                \_ -> Expect.equal (resolveExe atUsr "./bin/echo/") (IsNotDir (File ( [ "usr", "bin" ], "echo", 1 )))
            ]
        , describe "enumerateCmds"
            [ test "enumerate 1" <|
                \_ -> Expect.equal (enumerateCmds atRoot) [ "echo", "cd" ]
            , test "enumerate 2" <|
                \_ -> Expect.equal (enumerateCmds atUsr) [ "echo", "cd" ]
            ]
        ]
