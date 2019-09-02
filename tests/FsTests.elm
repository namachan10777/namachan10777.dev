module FsTests exposing (fsTests)

import Expect
import Os exposing (..)
import Test exposing (..)


usr : Fs
usr =
    Dir
        ( "usr"
        , [ Dir
                ( "bin"
                , [ File ( "echo", 1 )
                  ]
                )
          ]
        )


root : Fs
root =
    Dir
        ( "/"
        , [ File ( "root.txt", 0 )
          , usr
          ]
        )


fsTests : Test
fsTests =
    describe "test Os module"
        [ describe "getFromAbsPath"
            [ test "root" <|
                \_ -> Expect.equal (getFromAbsPath [] root) (Just root)
            , test "root.txt" <|
                \_ -> Expect.equal (getFromAbsPath [ "root.txt" ] root) (Just (File ( "root.txt", 0 )))
            , test "echo" <|
                \_ -> Expect.equal (getFromAbsPath [ "usr", "bin", "echo" ] root) (Just (File ( "echo", 1 )))
            , test "not found" <|
                \_ -> Expect.equal (getFromAbsPath [ "usr", "bin", "ech" ] root) Nothing
            ]
        , describe "resolvePath"
            [ test "absolute root" <|
                \_ -> Expect.equal (resolvePath root usr "/") (Exist root)
            , test "absolute echo" <|
                \_ -> Expect.equal (resolvePath root usr "/usr/bin/echo") (Exist (File ( "echo", 1 )))
            , test "relative echo 1" <|
                \_ -> Expect.equal (resolvePath root usr "./bin/echo") (Exist (File ( "echo", 1 )))
            , test "relative echo 2" <|
                \_ -> Expect.equal (resolvePath root usr "bin/echo") (Exist (File ( "echo", 1 )))
            , test "relative echo expect dir" <|
                \_ -> Expect.equal (resolvePath root usr "bin/echo/") (IsNotDir (File ( "echo", 1 )))
            , test "here" <|
                \_ -> Expect.equal (resolvePath root usr "./") (Exist usr)
            , test "not found" <|
                \_ -> Expect.equal (resolvePath root usr "./none") NotFound
            ]
        ]
